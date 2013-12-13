#---+ Extensions
#---++ ModacContextMenuPlugin

# **BOOLEAN**
# Enable usage of context menu explicitly - required to support VirtualHostingContrib
$Foswiki::cfg{Plugins}{ModacContextMenuPlugin}{UseContextMenu} = 0;

# **BOOLEAN**
# Check this to enable WebDAV support. Requires WebDAVContrib
$Foswiki::cfg{Plugins}{ModacContextMenuPlugin}{WebDAVEnabled} = 0;

# **STRING**
# Relative path to the WebDAV root of this wiki instance.
$Foswiki::cfg{Plugins}{ModacContextMenuPlugin}{WebDAVLocation} = '/bin/dav';

# **PERL**
# Mapping of file extensions and their according MS Office application object class.
$Foswiki::cfg{Plugins}{ModacContextMenuPlugin}{WebDAVApps} = {
    'Word.Documents' => 'doc|docx|docm|dot|dotm|dotx|rtf',
    'PowerPoint.Presentations' => 'ppt|pptx|pptm|pot|potx|potm|pps|ppsx|ppsm|sldx|sldm|thm|thmx',
    'Excel.Workbooks' => 'xls|xlsx|xlsm|xlt|xltx|xltm|xlsb|csv|xld|xlm|xlshtml|xlw|xlxml|xlthtml',
    'Visio.Documents' => 'vdw|vdx|vsd|vsdm|vsdx|vss|vssm|vst|vstm|vstx|vsu|vsw|vsx|vtx',
    'Publisher.Documents' => 'pub',
    'InfoPath.XDocuments' => 'xsf|xsn',
    'Project.Ignored' => 'mpd|mpp|mpt|mpw|mpx'
};
