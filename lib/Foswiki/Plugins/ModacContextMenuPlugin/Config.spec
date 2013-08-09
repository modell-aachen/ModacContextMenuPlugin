#---+ Extensions
#---++ ModacContextMenuPlugin

# **BOOLEAN**
# Whether WebDAV should be enabled or not
$Foswiki::cfg{Plugins}{ModacContextMenuPlugin}{WebDAVEnabled} = 0;

# **STRING**
# Location for which the webserver exports the WebDAV extension
$Foswiki::cfg{Plugins}{ModacContextMenuPlugin}{WebDAVLocation} = '/bin/dav';

# **PERL**
# Filename extensions that can be used with different
# Microsoft Office applications. Each key in this hash is the name of an
# <a href="http://msdn.microsoft.com/en-us/library/bb726436.aspx">)
# Office 2007 application object class</a>, followed by a full stop and the
# name of the collection field on that type of application, and maps to
# a string containing a perl regular expression used to match the file
# extensions for this application.
$Foswiki::cfg{Plugins}{ModacContextMenuPlugin}{WebDAVApps} = {
    'Word.Documents' => 'doc|docx|docm|dot|dotm|dotx',
    'PowerPoint.Presentations' => 'ppt|pptx|pptm|pot|potx|potm|ppam|ppsx|ppsm|sldx|sldm|thmx',
    'Excel.Workbooks' => 'xls|xlsx|xlsm|xlt|xltx|xltm|xlsb|xlam'
};
