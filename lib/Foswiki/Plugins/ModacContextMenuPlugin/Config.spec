#---+ Extensions
#---++ ModacContextMenuPlugin

# **BOOLEAN**
# Enable usage of context menu explicitly - required to support VirtualHostingContrib
$Foswiki::cfg{Plugins}{ModacContextMenuPlugin}{UseContextMenu} = 0;

# **BOOLEAN**
# Open documents using the MS Office URI schemes.
# Note: Minimum required Office versions: Office 2010 SP2, Office for Mac 2011
# Further information: https://msdn.microsoft.com/en-us/library/office/dn906146.aspx
$Foswiki::cfg{Plugins}{ModacContextMenuPlugin}{OfficeURISchemes} = 1;

# **BOOLEAN**
# Enable integration for TopicInteractionPlugin
$Foswiki::cfg{Plugins}{ModacContextMenuPlugin}{TopicInteraction} = 0;

# **BOOLEAN**
# Check this to enable WebDAV support. Requires WebDAVContrib
$Foswiki::cfg{Plugins}{ModacContextMenuPlugin}{WebDAVEnabled} = 0;

# **STRING**
# Relative path to the WebDAV root of this wiki instance.
$Foswiki::cfg{Plugins}{ModacContextMenuPlugin}{WebDAVLocation} = '/bin/dav';

# **PERL**
# Mapping of file extensions and their according MS Office application object class.
$Foswiki::cfg{Plugins}{ModacContextMenuPlugin}{WebDAVApps} = {
    'Access.Databases' => 'accdb|accdc|accde|accdr|accdt|accdu|accdw|accft|ade|adn|adp|mad|maf|mag|mam|maq|mar|mas|mat|mau|mav|maw|mdb|mde|mdn|mdt|mdw',
    'Word.Documents' => 'doc|docx|docm|dot|dotm|dotx|rtf',
    'PowerPoint.Presentations' => 'ppt|pptx|pptm|pot|potx|potm|pps|ppsx|ppsm|sldx|sldm|thm|thmx',
    'Excel.Workbooks' => 'xls|xlsx|xlsm|xlt|xltx|xltm|xlsb|csv|xld|xlm|xlshtml|xlw|xlxml|xlthtml',
    'Visio.Documents' => 'vdw|vdx|vsd|vsdm|vsdx|vss|vssm|vst|vstm|vstx|vsu|vsw|vsx|vtx',
    'Publisher.Documents' => 'pub',
    'Project.Ignored' => 'mpd|mpp|mpt|mpw|mpx'
};

#---+++ Menu Item Visibility
# **BOOLEAN EXPERT**
$Foswiki::cfg{Plugins}{ModacContextMenuPlugin}{DisableActionEdit} = 0;

# **BOOLEAN EXPERT**
$Foswiki::cfg{Plugins}{ModacContextMenuPlugin}{DisableActionDownload} = 0;

# **BOOLEAN EXPERT**
$Foswiki::cfg{Plugins}{ModacContextMenuPlugin}{DisableActionNewVersion} = 0;

# **BOOLEAN EXPERT**
$Foswiki::cfg{Plugins}{ModacContextMenuPlugin}{DisableActionHistory} = 0;

# **BOOLEAN EXPERT**
$Foswiki::cfg{Plugins}{ModacContextMenuPlugin}{DisableActionMove} = 0;

# **BOOLEAN EXPERT**
$Foswiki::cfg{Plugins}{ModacContextMenuPlugin}{DisableActionRename} = 0;

# **BOOLEAN EXPERT**
$Foswiki::cfg{Plugins}{ModacContextMenuPlugin}{DisableActionRemove} = 0;

# **BOOLEAN EXPERT**
$Foswiki::cfg{Plugins}{ModacContextMenuPlugin}{DisableActionEditComment} = 0;
