(function($) {
  $(document).ready( function() {
    if ( !window.foswiki ) return;

    var prefs = foswiki.getPreference( 'contextMenu' );
    // Tribute to VirtualHostingContrib ;)
    // Required, otherwise all virtual hosts would be forced to use the context menu.
    if ( !prefs.useContextMenu ) return;

    // initialize context menu only when attachments are present.
    var container = $('div.foswikiAttachments');
    if ( $(container).length == 0 ) return;

    var lang = {
      guestUser: 'WikiGuest',
      lockedBy: 'Locked by {0}',
      editAttachment: 'Edit attachment',
      editAttachmentIn: 'Edit in {0}',
      useAsTemplate: 'Use as template',
      downloadAttachment: 'Open a copy',
      newVersion: 'Upload new version',
      newVersionDialogTitle: 'Update attachment',
      manageVersions: 'Manage versions',
      manageVersionsDialogTitle: 'History of "{0}"',
      moveAttachment: 'Move',
      moveAttachmentDialogTitle: 'Move attachment "{0}"',
      renameAttachment: 'Rename',
      renameAttachmentDialogTitle: 'Rename attachment "{0}"',
      deleteAttachment: 'Delete',
      deleteAttachmentDialogTitle: 'Delete attachment "{0}"',
      deleteAttachmentDialogText: 'Are you sure you want to delete the selected file?',
      editComment: 'Update comment',
      editCommentDialogTitle: 'Update comment',
      btnUploadText: 'Upload',
      btnCancelText: 'Cancel',
      btnLoginText: 'Login',
      btnCloseText: 'Close',
      btnDeleteText: 'Yes, delete',
      btnSaveText: 'Save',
      btnMoveText: 'Move',
      btnRenameText: 'Rename',
      blockUIMessage: 'Please wait',
      oopsTitle: 'Oops! An error occurred',
      oopsText: 'Please try again.',
      loginRequiredTitle: 'Login required',
      webdavFFHintTitle: 'Firefox add-on required',
      webdavFFHintText: 'In order to use this functionality an additional add-on is required.<br />This extension is available for download at the official {0}.',
      webdavFFLinkText: 'Mozilla Add-on site',
      webdavChromeHintTitle: 'Chrome extension required',
      webdavChromeHintText: 'In order to use this functionality an additional extension is required.<br />This extension is available for download at the official {0}.',
      useURISchemesTitle: 'Activate Office URI Schemes',
      useURISchemesHintText: 'In order to use this functionality activate Office URI Schemes. Pleas ask your administrator.<br />.',
      webdavChromeLinkText: 'Google web store'
    };

    window.foswiki.ModacContextMenuPluginLang = lang;
  });
})(jQuery);
