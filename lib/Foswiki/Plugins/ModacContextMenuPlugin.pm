package Foswiki::Plugins::ModacContextMenuPlugin;

use strict;
use warnings;

use Foswiki::Func    ();
use Foswiki::Meta    ();
use Foswiki::Plugins ();

use Foswiki::UI::Rename;

use Foswiki::Plugins::VueJSPlugin;

use Digest::SHA;
use JSON;

use version;
our $VERSION = version->declare("v1.1.0");
our $RELEASE = '1.1';
our $SHORTDESCRIPTION = 'Provides a simple context menu for AttachTables.';
our $NO_PREFS_IN_TOPIC = 1;

sub initPlugin {
  my ( $topic, $web, $user, $installWeb ) = @_;

  if ( $Foswiki::Plugins::VERSION < 2.0 ) {
    Foswiki::Func::writeWarning(
      'Version mismatch between ',
      __PACKAGE__,
      ' and Plugins.pm'
    );

    return 0;
  }

  # Removes the User's Web prefix. Intended for further modifications like wiki word to space separated word.
  Foswiki::Func::registerTagHandler( 'PRETTYUSER', \&_handlePrettyUserTag );
  Foswiki::Func::registerTagHandler( 'RENAME_ATTACHMENT_LINKS', \&_tagRenameAttachment );

  # rest handler to interact with FilesysVirtualPlugin
  Foswiki::Func::registerRESTHandler( 'isLocked', \&_restIsLocked, http_allow => 'GET', validate => 0, authenticate => 0 );
  Foswiki::Func::registerRESTHandler( 'tokenizer', \&_restTokenizer, http_allow => 'GET', validate => 0, authenticate => 1 );
  Foswiki::Func::registerRESTHandler( 'attachHistory', \&_rest_attach_history, http_allow => 'GET', validate => 0, authenticate => 1 );

  my $jqAvailable = $Foswiki::cfg{Plugins}{JQueryPlugin}{Enabled};
  unless ( $jqAvailable ) {
    Foswiki::Func::writeWarning(
      'A recent version of JQueryPlugin is required in order to run '
      . 'ModacContextMenuPlugin correctly.' );
    return 0;
  }

  my $context = Foswiki::Func::getContext();
  return 1 unless $context->{view} || $context->{edit} || $context->{comparing} || $context->{oops} || $context->{manage};

  my $pluginUrl = '%PUBURLPATH%/%SYSTEMWEB%/ModacContextMenuPlugin';

  my $langCode = $Foswiki::Plugins::SESSION->i18n->language;
  $langCode = 'en' unless $langCode =~ /en|de/i;

  Foswiki::Plugins::VueJSPlugin::loadDependencies($Foswiki::Plugins::SESSION, {VERSION => 2}, $topic, $web);

  my $script = <<"SCRIPT";
<script type="text/javascript" src="$pluginUrl/jquery.contextMenu.js?version=$RELEASE"></script>
<script type="text/javascript" src="$pluginUrl/jquery.ui.position.js?version=$RELEASE"></script>
<script type="text/javascript" src="$pluginUrl/lang/$langCode.js?version=$RELEASE"></script>
<script type="text/javascript" src="$pluginUrl/modacContextMenu.js?version=$RELEASE"></script>
SCRIPT

  my $meta = <<"META";
<link rel="stylesheet" type="text/css" media="all" href="$pluginUrl/jquery.contextMenu.css?version=$RELEASE" />
<link rel="stylesheet" type="text/css" media="all" href="$pluginUrl/modacContextMenu.css?version=$RELEASE" />
META

  Foswiki::Plugins::JSi18nPlugin::JSI18N($Foswiki::Plugins::SESSION, "ModacContextMenuPlugin", "ModacContextMenu");
  Foswiki::Func::addToZone( 'head', 'MODACCONTEXTMENUPLUGIN:STYLES', $meta );
  Foswiki::Func::addToZone( 'script', 'MODACCONTEXTMENUPLUGIN:SCRIPTS', $script, 'MODACCONTEXTMENUPLUGIN:PREFS,jsi18nCore,VUEJSPLUGIN');
  Foswiki::Plugins::JQueryPlugin::createPlugin( 'blockui' );
  Foswiki::Plugins::JQueryPlugin::createPlugin( 'livequery' );

  _attachPrefs( $web, $topic );
  return 1;
}

sub _handlePrettyUserTag {
  my( $session, $params, $topic, $web, $topic_object ) = @_;
  my $wikiWord = $params->{_DEFAULT};
  if ( $wikiWord =~ /(.+)\.(.+)/ ) {
    return $2;
  }

  # ToDo: WikiWord -> Wiki Word

  return $wikiWord;
}

sub _rest_attach_history {
  my ( $session, $subject, $verb, $response ) = @_;
  my $query = $session->{request};

  my $web = $query->{param}->{w}[0];
  my $topic = $query->{param}->{t}[0];
  my $attachment = $query->{param}->{a}[0];

  my $change = Foswiki::Func::checkAccessPermission('VIEW', $session->{user}, undef, $topic, $web);
  if ( $change ) {
      my $topic_object = Foswiki::Meta->load($session, $web, $topic);
      my $args = $topic_object->get( 'FILEATTACHMENT', $attachment);
      $args = {
          name => $attachment,
          path => '',
          comment => ''
      } unless ($args);
      $args->{attr} ||= '';

      my $history = $session->attach->formatVersions($topic_object, %$args);
      my $history_table = $topic_object->expandMacros($history);
      $history_table =~ s/%TABLE\{[^\}]+\}%//;
      $history_table =~ s/<a\s*href="([^"]+)">restore</<a class="foswikiRequiresChangePermission requireModacChangePermission" href="$1">restore</g;
      $response->status(200);
      return $history_table
  } else {
      # Forbidden
      $response->status(403);
      return '';
  }
}

sub _restTokenizer {
  my ( $session, $subject, $verb, $response ) = @_;
  my $query = $session->{request};

  my $web = $query->{param}->{w}[0];
  my $topic = $query->{param}->{t}[0];
  my $attachment = $query->{param}->{a}[0];

  my $wikiName = Foswiki::Func::getWikiName( $session->{user} );
  my $guest = $Foswiki::cfg{DefaultUserWikiName} || 'WikiGuest';
  if ( $wikiName ne $guest ) {
    my ($w, $t) = Foswiki::Func::normalizeWebTopicName( $web, $topic );
    my $path = "$w/$t";
    my %opts = (validateLogin => 0);

    require Filesys::Virtual::Foswiki;
    my $fs = Filesys::Virtual::Foswiki->new(\%opts);
    my $db = $fs->_locks();
    my %data = (user => $wikiName, path => $path, file => $attachment);
    my $token = Digest::SHA::sha1_hex( encode_json( \%data ) . rand(1_000_000) );
    if ( $db->setAuthToken( $token, \%data ) )
    {
      $response->pushHeader( 'X-MA-TOKEN', $token );
    }
  }

  $response->status(200);
  return '';
}

sub _restIsLocked {
  my ( $session, $subject, $verb, $response ) = @_;
  my $query = $session->{request};

  my $web = $query->{param}->{w}[0];
  my $topic = $query->{param}->{t}[0];
  my $attachment = $query->{param}->{a}[0];

  my $err = '{ "isLocked": 0 }';
  return $err unless $web && $topic && $attachment;

  my $fsvAvailable = $Foswiki::cfg{Plugins}{FilesysVirtualPlugin}{Enabled};
  return $err unless $fsvAvailable;

  my $lockdb = _getLockDb();
  return $err unless $lockdb;

  # query lockdb for existing (exclusive) locks.
  my $davUrl = _getWebDAVUrl();
  my $path = "$davUrl/$web/$topic" . "_files/$attachment";
  $path =~ s/^((http[s]?):\/)?\/?([^:\/\s]+)((\/\w+)*\/)([\w\-\.]+[^#?\s]+)(.*)?(#[\w\-]+)?$/$4$6/;
  my @locks = $lockdb->getLocks( $path, 0 );

  foreach my $lock (@locks) {
    next unless $lock->{exclusive};

    if ( $lock->{path} eq $path ) {
      my $owner = $lock->{owner};
      if  ( $owner =~ /<D:href>(.+)<\/D:href>/i ) {
        $owner = $1;
      }

      my $timeout = $lock->{timeout} || $Foswiki::cfg{LeaseLength} || 3600;
      my $now = time;
      my $taken = $lock->{taken} || $now;
      next unless ($taken + $timeout gt $now);

      my $wikiName = Foswiki::Func::userToWikiName( $owner, 1 );
      return "{ \"isLocked\": 1, \"owner\": \"$wikiName\" }"
    }
  }

  return $err;
}

sub _attachPrefs {
  my ( $web, $topic ) = @_;

  my $trash = $Foswiki::cfg{TrashWebName} || 'Trash';
  my $uriSchemes = $Foswiki::cfg{Plugins}{ModacContextMenuPlugin}{OfficeURISchemes} || 0;
  my $disableMove = $Foswiki::cfg{Plugins}{ModacContextMenuPlugin}{DisableActionMove} || 0;
  my $disableRename = $Foswiki::cfg{Plugins}{ModacContextMenuPlugin}{DisableActionRename} || 0;
  my $disableEdit = $Foswiki::cfg{Plugins}{ModacContextMenuPlugin}{DisableActionEdit} || 0;
  my $disableDownload = $Foswiki::cfg{Plugins}{ModacContextMenuPlugin}{DisableActionDownload} || 0;
  my $disableNewVersion = $Foswiki::cfg{Plugins}{ModacContextMenuPlugin}{DisableActionNewVersion} || 0;
  my $disableHistory = $Foswiki::cfg{Plugins}{ModacContextMenuPlugin}{DisableActionHistory} || 0;
  my $disableRemove = $Foswiki::cfg{Plugins}{ModacContextMenuPlugin}{DisableActionRemove} || 0;
  my $disableComment = $Foswiki::cfg{Plugins}{ModacContextMenuPlugin}{DisableActionEditComment} || 0;

  my $ctx = Foswiki::Func::getContext();
  my %prefs = (
    kvpIsEnabled => Foswiki::isTrue($ctx->{'KVPControlled'}, 0) ? JSON::true : JSON::false,
    kvpCanEdit => Foswiki::isTrue($ctx->{'KVPEdit'}, 0) ? JSON::true : JSON::false,
    davIsEnabled => JSON::false,
    hasLocation => JSON::true,
    newWindow => JSON::false,
    trashWeb => $trash,
    canEdit => JSON::false,
    canDelete => JSON::false,
    uriSchemes => $uriSchemes ? JSON::true : JSON::false,
    disableEdit => $disableEdit ? JSON::true : JSON::false,
    disableDownload => $disableDownload ? JSON::true : JSON::false,
    disableNewVersion => $disableNewVersion ? JSON::true : JSON::false,
    disableHistory => $disableHistory ? JSON::true : JSON::false,
    disableRemove => $disableRemove ? JSON::true : JSON::false,
    disableComment => $disableComment ? JSON::true : JSON::false,
    disableMove => $disableMove ? JSON::true : JSON::false,
    disableRename => $disableRename ? JSON::true : JSON::false
  );

  my $session = $Foswiki::Plugins::SESSION;
  my $change = Foswiki::Func::checkAccessPermission('CHANGE', $session->{user}, undef, $topic, $web);
  $prefs{canEdit} = $change ? JSON::true : JSON::false;
  $prefs{canDelete} = $prefs{canEdit};

  # double checked in order to support virtual hosting.
  if ( $Foswiki::cfg{Plugins}{ModacContextMenuPlugin}{WebDAVEnabled} ) {
    my $location = $Foswiki::cfg{Plugins}{ModacContextMenuPlugin}{WebDAVLocation} || "";
    unless ( $location ) {
      Foswiki::Func::writeWarning( "No WebDAV location specified (in Foswiki::cfg{Plugins}{ModacContextMenuPlugin}{WebDAVLocation})." );
      $prefs{hasLocation} = JSON::false;
    }

    my $server = $session->{urlHost};
    my $davUrl = Foswiki::urlEncode( $server . $location );
    my $cfgApps = $Foswiki::cfg{Plugins}{ModacContextMenuPlugin}{WebDAVApps} || '';
    my $officeApps = Foswiki::urlEncode( JSON::to_json( $cfgApps ) );

    $prefs{davIsEnabled} = JSON::true;
    $prefs{davUrl} = $davUrl;
    $prefs{apps} = $officeApps;
  }

  my $enabled = $Foswiki::cfg{Plugins}{ModacContextMenuPlugin}{UseContextMenu} || 0;
  $prefs{useContextMenu} = $enabled ? JSON::true : JSON::false;
  my $ti = $Foswiki::cfg{Plugins}{ModacContextMenuPlugin}{TopicInteraction} || 0;
  $prefs{useTopicInteraction} = $ti ? JSON::true : JSON::false;
  my $newWindow = Foswiki::Func::getPreferencesValue("MODAC_CONTEXT_BLANK") || 0;
  $prefs{newWindow} = JSON::true if ( $newWindow =~ /^(1|on|true|enabled?)/i);

  my $json = JSON::to_json(\%prefs);
  Foswiki::Func::addToZone(
    "script",
    "MODACCONTEXTMENUPLUGIN:PREFS",
    "<script type='text/javascript'>jQuery.extend( foswiki.preferences, {\"contextMenu\": $json});</script>",
    "JQUERYPLUGIN::FOSWIKI::PREFERENCES");
}

sub _getLockDb {
  require Filesys::Virtual::Locks;
  my $path = Foswiki::Func::getWorkArea( 'FilesysVirtualPlugin' ) . '/lockdb';
  return new Filesys::Virtual::Locks( $path );
}

sub _getWebDAVUrl {
  my $session = $Foswiki::Plugins::SESSION;
  my $server = $session->{urlHost};
  my $location = $Foswiki::cfg{Plugins}{ModacContextMenuPlugin}{WebDAVLocation};
  $location =~ s/\/*$//;
  $server =~ s/\/*$//;
  return "$server$location";
}

sub _tagRenameAttachment {
    my ( $session, $params, $topic, $web, $meta ) = @_;

    my $clientToken = Foswiki::Plugins::VueJSPlugin::getClientToken();
    return <<HTML;
        <div class="vue-rename-attachment" data-vue-client-token="$clientToken">
            <rename-attachment attachment="$params->{attachment}" web="$web" topic="$topic"/>
        </div>
HTML
}

sub afterRenameHandler {
    my ( $oldWeb, $oldTopic, $oldAttachment, $newWeb, $newTopic, $newAttachment ) = @_;

    return unless $oldTopic; # do not handle Webs
    return unless $oldAttachment; # handle just attachments

    my $session = $Foswiki::Plugins::SESSION;
    my $query = Foswiki::Func::getCgiQuery();
    my @topics = $query->param('referring_topics');

    my $options = {
        oldWeb    => "$oldWeb/$oldTopic",
        oldTopic  => $oldAttachment,
        newWeb    => "$newWeb/$newTopic",
        newTopic  => $newAttachment,
        fullPaths => 0,
        noautolink => 1,
        inMeta => 1
    };

    # change referring topics
    Foswiki::UI::Rename::_updateReferringTopics($session, \@topics, \&Foswiki::UI::Rename::_replaceTopicReferences, $options) if scalar(@topics) > 0;

    #handle %ATTACHURLPATH%
    _replaceATTACHURLPATH($session, $oldWeb, $oldTopic, $newWeb, $newTopic);
}

sub _replaceATTACHURLPATH {
    my ($session, $oldWeb, $oldTopic, $newWeb, $newTopic) = @_;
    my $topicObject = Foswiki::Meta->load( $session, $oldWeb, $oldTopic );

    my $newText = '';
    foreach my $line ( split( /([\r\n]+)/, $topicObject->text() ) ) {
        $line =~ s/%ATTACHURLPATH%/%PUBURL%\/$newWeb\/$newTopic/g;
        $newText .= $line;
    }
    $topicObject->text($newText);
    $topicObject->save( minor => 1 );
}

1;

__END__
Foswiki - The Free and Open Source Wiki, http://foswiki.org/

Copyright (C) 2013 Modell Aachen GmbH

This program is free software; you can redistribute it and/or
modify it under the terms of the GNU General Public License
as published by the Free Software Foundation; either version 2
of the License, or (at your option) any later version. For
more details read LICENSE in the root of this distribution.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.

As per the GPL, removal of this notice is prohibited.
