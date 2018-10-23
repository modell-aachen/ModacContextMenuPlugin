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
      lockedBy: 'Gesperrt von {0}',
      editAttachment: 'Datei bearbeiten',
      editAttachmentIn: 'In {0} bearbeiten',
      useAsTemplate: 'Als Vorlage verwenden',
      downloadAttachment: 'Kopie &ouml;ffnen',
      newVersion: 'Neue Version hochladen',
      newVersionDialogTitle: 'Anhang aktualisieren',
      manageVersions: 'Versionsverwaltung',
      manageVersionsDialogTitle: 'Historie von "{0}"',
      moveAttachment: 'Verschieben/Umbenennen',
      moveAttachmentDialogTitle: 'Anhang "{0}" verschieben/umbenennen',
      renameAttachment: 'Umbenennen',
      renameAttachmentDialogTitle: 'Anhang "{0}" umbenennen',
      deleteAttachment: 'L&ouml;schen',
      deleteAttachmentDialogTitle: 'Anhang "{0}" l\u00F6schen',
      deleteAttachmentDialogText: 'Sind Sie sicher, dass Sie die ausgew\u00E4hlte Datei l\u00F6schen m\u00F6chten?',
      editComment: 'Kommentar bearbeiten',
      editCommentDialogTitle: 'Kommentar bearbeiten',
      btnUploadText: 'Hochladen',
      btnCancelText: 'Abbrechen',
      btnLoginText: 'Anmelden',
      btnCloseText: 'Schlie\u00DFen',
      btnDeleteText: 'Ja, l\u00F6schen',
      btnSaveText: 'Speichern',
      btnMoveText: 'Verschieben/Umbenennen',
      btnRenameText: 'Umbenennen',
      blockUIMessage: 'Bitte warten',
      oopsTitle: 'Ups! Es ist ein Fehler aufgetreten',
      oopsText: 'Bitte versuchen Sie es erneut.',
      loginRequiredTitle: 'Anmeldung erforderlich',
      webdavFFHintTitle: 'Firefox Add-on erforderlich',
      webdavFFHintText: 'F\u00FCr diese Funktion ist ein weiteres Browser Add-on erforderlich.<br />Diese Erweiterung k\u00F6nnen Sie \u00FCber die offizielle {0} herunterladen.',
      webdavFFLinkText: 'Mozilla Add-on Seite',
      webdavChromeHintTitle: 'Chrome Extension erforderlich',
      webdavChromeHintText: 'F\u00FCr diese Funktion ist eine weitere Chrome-Extension erforderlich.<br />Diese Erweiterung k\u00F6nnen Sie \u00FCber den offiziellen {0} herunterladen.',
      useURISchemesTitle: 'Office URI Schemes aktivieren',
      useURISchemesHintText: 'Um diese Funktion nutzen zu können, müssen die Office URI Schemes aktiviert werden. Sprechen Sie dafür bitte Ihren Administrator an.',
      webdavChromeLinkText: 'Google Web Store'
    };

    window.foswiki.ModacContextMenuPluginLang = lang;
  });
})(jQuery);

