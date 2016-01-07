package Foswiki::Plugins::ModacContextMenuPlugin;

use strict;
use warnings;

use Foswiki::Func    ();
use Foswiki::Plugins ();

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

  # rest handler to interact with FilesysVirtualPlugin
  Foswiki::Func::registerRESTHandler( 'isLocked', \&_restIsLocked, http_allow => 'GET', validate => 0, authenticate => 0 );
  Foswiki::Func::registerRESTHandler( 'tokenizer', \&_restTokenizer, http_allow => 'GET', validate => 0, authenticate => 1 );

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

  my $script = <<"SCRIPT";
<script type="text/javascript" src="$pluginUrl/jquery.contextMenu.js?version=$RELEASE"></script>
<script type="text/javascript" src="$pluginUrl/jquery.ui.position.js?version=$RELEASE"></script>
<script type="text/javascript" src="$pluginUrl/lang/$langCode.js?version=$RELEASE"></script>
<script type="text/javascript" src="$pluginUrl/modac.contextMenu.js?version=$RELEASE"></script>
SCRIPT

  my $meta = <<"META";
<link rel="stylesheet" type="text/css" media="all" href="$pluginUrl/jquery.contextMenu.css?version=$RELEASE" />
META

  Foswiki::Func::addToZone( 'head', 'MODACCONTEXTMENUPLUGIN:STYLES', $meta );
  Foswiki::Func::addToZone( 'script', 'MODACCONTEXTMENUPLUGIN:SCRIPTS', $script, 'MODACCONTEXTMENUPLUGIN:PREFS' );
  Foswiki::Plugins::JQueryPlugin::createPlugin( 'blockui' );
  Foswiki::Plugins::JQueryPlugin::createPlugin( 'livequery' );

  _attachPrefs( $web, $topic );
  return 1;
}

sub _handlePrettyUserTag {
  my( $session, $params, $topic, $web, $topicObject ) = @_;
  my $wikiWord = $params->{_DEFAULT};
  if ( $wikiWord =~ /(.+)\.(.+)/ ) {
    return $2;
  }

  # ToDo: WikiWord -> Wiki Word

  return $wikiWord;
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
    uriSchemes => $uriSchemes ? JSON::true : JSON::false
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
