package ModacContextMenuPluginTests;

use strict;
use warnings;

use FoswikiSeleniumWdTestCase;
our @ISA = qw( FoswikiSeleniumWdTestCase );

use Foswiki::Func;

our @attachments; # attachments

sub new {
    my $this = shift;
    my ( @args) = @_;
    $this = $this->SUPER::new('ModacContextMenuPluginTests', @args);
    return $this;
}

# opens ContextMenu for first attachment
# returns linktext for first item
sub _openContextMenu()
{
    my ( $this ) = @_;


    # find attachment table
    my $tablediv = $this->{selenium}->find_element("topicattachmentslist3toggle","id");

    # if not visible click attachment toggle
    unless ( $tablediv->is_displayed() )
    {
        # open attachment list, by clicking on attachment twisty
        $this->{selenium}->find_element(".patternTwistyButton.patternAttachmentHeader","css")->click();
    }
    $this->assert($tablediv->is_displayed());

    # find first attachment in table
    my $attachRow = $this->{selenium}->find_child_element($tablediv, ".foswikiTableEven.foswikiTableRowdataBgSorted1.foswikiTableRowdataBg1", "css");
    my $attachTD = $this->{selenium}->find_child_element($attachRow, ".foswikiTableCol1", "css");

    # parse link, click link
    my $linkText= substr($attachTD->get_text(), 0, -2);
    $linkText =~ s/^\s*(\S.*)$/$1/;
    $this->{selenium}->find_child_element($attachTD, $linkText,"partial_link_text")->click();
    sleep 1; # wait a second for the menu to pop up, otherwise, something is wrong

    # return parsed link
    return $linkText;
}

# Test if...
# context menu pops up
sub verify_contextMenuPopUp {
    my ( $this ) = @_;

    $this->login();

    # open WebHome, there is usually a ProcessOverview.png or something
    $this->{selenium}->get(
        Foswiki::Func::getScriptUrl(
            "Prozesse", $Foswiki::cfg{HomeTopicName}, "view", t => time()
        )
    );

    # open context menu for first link
    $this->_openContextMenu();
    # find menu_root
    my $menu = $this->{selenium}->find_element(".context-menu-list.context-menu-root","css");
}

sub verify_contextMenuDownload()
{
    my ( $this ) = @_;

    $this->login();

    # open WebHome, there is usually a ProcessOverview.png
    $this->{selenium}->get(
        Foswiki::Func::getScriptUrl(
            "Prozesse", $Foswiki::cfg{HomeTopicName}, "view", t => time()
        )
    );

    my $linkText = $this->_openContextMenu();
    # find context menu
    my $menu = $this->{selenium}->find_element(".context-menu-list.context-menu-root","css");
    # find download item and click it
    $this->{selenium}->find_child_element($menu,".context-menu-item.icon.icon-download","css")->click();

    # check if link of the attachment is as expected
    $this->assert( $this->{selenium}->get_current_url() =~ /$linkText/);

    $this->{selenium}->go_back();
}

1;

__END__
Foswiki - The Free and Open Source Wiki, http://foswiki.org/

Copyright (C) 2014 Modell Aachen GmbH

This program is free software; you can redistribute it and/or
modify it under the terms of the GNU General Public License
as published by the Free Software Foundation; either version 2
of the License, or (at your option) any later version. For
more details read LICENSE in the root of this distribution.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.

As per the GPL, removal of this notice is prohibited.
