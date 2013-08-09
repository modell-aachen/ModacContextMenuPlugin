(function($) {
  $.fn.extend( {
    attachContextMenu: function( td ) {
      var isSupportedBrowser = $(this).isSupportedBrowser();

      var davUrl = $(this).getWebDAVUrl();
      var hasDavUrl = davUrl != null;

      var apps = $(this).getOfficeApps();
      var hasApps = apps != null;

      var $this = $(td);
      var href = $this.find('a').attr( 'href' );
      var filename = $this.find('a').text();

      var hasHandler = false;
      var component, componentName;
      for ( var app in apps ) {
        var exts = new RegExp( "\\.(" + apps[app] + ")$" );
        if ( exts.test( href ) ) {
          hasHandler = true;
          componentName = app.split( '.' )[0];
          component = app;
          break;
        }
      }

      var kvpCanEdit = true;
      var kvpCanMove = true;
      if ( $(this).kvpIsEnabled() ) {
        kvpCanEdit = $(this).kvpCanEdit();
        kvpCanMove = $(this).kvpCanMove();
      }

      var isEditEnabled = isSupportedBrowser
        && hasDavUrl
        && hasApps
        && hasHandler
        && kvpCanEdit;

      var pubPath = foswiki.getPreference( 'PUBURLPATH' );
      var binPath = foswiki.getPreference( 'SCRIPTURLPATH' );
      var scriptSuffix = foswiki.getPreference( 'SCRIPTSUFFIX' );
      var web = foswiki.getPreference( 'WEB' );
      var topic = foswiki.getPreference( 'TOPIC' );

      var newTopic = topic + '_files';
      href = href.replace( topic, newTopic );
      href = href.replace( pubPath, davUrl );

      // see de.js/en.jsr
      var lang = contextMenuStrings.lang;

      var regularMenu = {
        items: {
          'edit': {
            name: isEditEnabled
                    ? $(this).formatString( lang.editAttachmentIn, componentName )
                    : lang.editAttachment,
            icon: 'edit',
            disabled: !isEditEnabled,
            callback: function( key, opts ) {
              if ( $.browser.msie ) {
                return $(this).webdavInvokeIE( component, href );
              }

              if ( $.browser.mozilla ) {
                if ( !foswiki.hasFFAddon ) {
                  $(this).createFirefoxAddonDialog();
                  return;
                }
                var div = document.getElementById( 'hiddenContainer' );
                var a = document.createElement( 'a' );
                a.setAttribute( 'href', href );
                div.appendChild( a );

                a.onclick = function( e ) {
                  return $(this).webdavInvokeFF( e );
                };

                a.click();
              }
            }
          },

          'download': {
            name: lang.downloadAttachment,
            icon: 'download',
            callback: function( key, opts ) {
              window.location.href = href;
            }
          },

          sep1: "---------",

          'newversion': {
            name: lang.newVersion,
            icon: 'newversion',
            disabled: !kvpCanEdit,
            callback: function( key, opts ){
              var attachUrl = $(this).formatString(
                "{0}/attach{1}/{2}/{3}?filename={4}",
                binPath,
                scriptSuffix,
                web,
                topic,
                filename
              );

              $(this).blockUI();
              $.ajax({
                url: attachUrl,
                complete: function( xhr, status ) {
                  $(this).unblockUI();
                },
                error: function( xhr, status, error ) {
                  $(this).createErrorDialog();
                  $(this).logError( error );
                },
                success: function( page, status, xhr ) {
                  if ( $(this).isLoginForm( page ) ) return;
                  var form = $(page).find('form.modacUpload');
                  var d = $('<div></div>');
                  $(form).appendTo( d );

                  $(d).find('div.patternBorder').hide();
                  $(d).find('div.foswikiFormStep.foswikiLast').hide();

                  $(d).dialog({
                    title: lang.newVersionDialogTitle,
                    closeOnEscape: true,
                    modal: true,
                    minWidth: 600,
                    minHeight: 315,
                    show: {
                      effect: 'fade',
                      duration: 500
                    },
                    hide: {
                      effect: 'fade',
                      duration: 300
                    },
                    buttons: [
                      {
                        text: lang.btnUploadText,
                        click: function() {
                          $(d).find('input.foswikiSubmit').click();
                          $(this).dialog('close');
                        }
                      },
                      {
                        text: lang.btnCancelText,
                        click: function() {
                          $(this).dialog('close');
                        }
                      }
                    ]
                  });
                }
              });
            }
          },

          'versions': {
            name: lang.manageVersions,
            icon: 'versions',
            callback: function( key, opts ){
              var attachUrl = $(this).formatString(
                "{0}/attach{1}/{2}/{3}?filename={4}",
                binPath,
                scriptSuffix,
                web,
                topic,
                filename
              );

              $(this).blockUI();
              $.ajax({
                url: attachUrl,
                complete: function( xhr, status ) {
                  $(this).unblockUI();
                },
                error: function( xhr, status, error ) {
                  $(this).createErrorDialog();
                  $(this).logError( error );
                },
                success: function( page, status, xhr ) {
                  if ( $(this).isLoginForm( page ) ) return;
                  var form = $(page).find('div.foswikiAttachments');
                  var d = $('<div></div>');
                  $(d).html( form );

                  $(d).dialog({
                    title: $(this).formatString( lang.manageVersionsDialogTitle, filename ),
                    closeOnEscape: true,
                    modal: true,
                    minWidth: 700,
                    minHeight: 190,
                    show: {
                      effect: 'fade',
                      duration: 500
                    },
                    hide: {
                      effect: 'fade',
                      duration: 300
                    },
                    buttons: [
                      {
                        text: lang.btnCloseText,
                        click: function() {
                          $(this).dialog('close');
                        }
                      }
                    ]
                  });
                }
              });
            }
          },

          sep2: "---------",

          'move': {
            name: lang.moveAttachment,
            icon: 'move',
            disabled: !kvpCanMove,
            callback: function( key, opts ){
              var moveUrl = $(this).formatString(
                "{0}/rename{1}/{2}/{3}?template=moveattachment&attachment={4}",
                binPath,
                scriptSuffix,
                web,
                topic,
                filename
              );

              $(this).blockUI();
              $.ajax({
                url: moveUrl,
                complete: function( xhr, status ) {
                  $(this).unblockUI();
                },
                error: function( xhr, status, error ) {
                  $(this).createErrorDialog();
                  $(this).logError( error );
                },
                success: function( page, status, xhr ) {
                  if ( $(this).isLoginForm( page ) ) return;
                  var form = $(page).find('form').last();
                  $(form).find('div.patternBorder').hide();
                  $(form).find('div.foswikiFormSteps').children().first().hide();
                  var d = $('<div></div>');
                  $(form).appendTo( d );

                  $(d).dialog({
                    title: $(this).formatString( lang.moveAttachmentDialogTitle, filename ),
                    closeOnEscape: true,
                    modal: true,
                    minWidth: 700,
                    minHeight: 190,
                    show: {
                      effect: 'fade',
                      duration: 500
                    },
                    hide: {
                      effect: 'fade',
                      duration: 300
                    },
                    buttons: [
                      {
                        text: lang.btnMoveText,
                        click: function() {
                          $(form).find('input.foswikiSubmit').click();
                          $(this).dialog('close');
                        }
                      },
                      {
                        text: lang.btnCancelText,
                        click: function() {
                          $(this).dialog('close');
                        }
                      }
                    ]
                  });
                }
              });
            }
          },

          'rename': {
            name: lang.renameAttachment,
            icon: 'rename',
            disabled: !kvpCanEdit,
            callback: function( key, opts ){
              var moveUrl = $(this).formatString(
                "{0}/rename{1}/{2}/{3}?template=moveattachment&attachment={4}",
                binPath,
                scriptSuffix,
                web,
                topic,
                filename
              );

              $(this).blockUI();
              $.ajax({
                url: moveUrl,
                complete: function( xhr, status ) {
                  $(this).unblockUI();
                },
                error: function( xhr, status, error ) {
                  $(this).createErrorDialog();
                  $(this).logError( error );
                },
                success: function( page, status, xhr ) {
                  if ( $(this).isLoginForm( page ) ) return;
                  var form = $(page).find('form').last();
                  $(form).find('div.patternBorder').hide();
                  $(form).find('div.foswikiFormStep:lt(3)').hide();
                  $(form).find('input.foswikiInputField').first().val( topic );
                  var d = $('<div></div>');
                  $(form).appendTo( d );

                  $(d).dialog({
                    title: $(this).formatString( lang.renameAttachmentDialogTitle, filename ),
                    closeOnEscape: true,
                    modal: true,
                    minWidth: 700,
                    minHeight: 190,
                    show: {
                      effect: 'fade',
                      duration: 500
                    },
                    hide: {
                      effect: 'fade',
                      duration: 300
                    },
                    buttons: [
                      {
                        text: lang.btnRenameText,
                        click: function() {
                          $(form).find('input.foswikiSubmit').click();
                          $(this).dialog('close');
                        }
                      },
                      {
                        text: lang.btnCancelText,
                        click: function() {
                          $(this).dialog('close');
                        }
                      }
                    ]
                  });
                }
              });
            }
          },

          'delete': {
            name: lang.deleteAttachment,
            icon: 'delete',
            disabled: !kvpCanEdit,
            callback: function( key, opts ){
              var trashWeb = foswiki.getPreference( 'contextMenu' ).trashWeb;
              var deleteUrl = $(this).formatString(
                "{0}/rename{1}/{2}/{3}?newweb={4};newtopic=TrashAttachment;template=renameattachmentdelete;attachment={5}",
                binPath,
                scriptSuffix,
                web,
                topic,
                trashWeb,
                filename
              );

              $(this).blockUI();
              $.ajax({
                url: deleteUrl,
                complete: function( xhr, status ) {
                  $(this).unblockUI();
                },
                error: function( xhr, status, error ) {
                  $(this).createErrorDialog();
                  $(this).logError( error );
                },
                success: function( page, status, xhr ) {
                  if ( $(this).isLoginForm( page ) ) return;
                  var d = $( $(this).formatString( '<div>{0}</div>', lang.deleteAttachmentDialogText ) );
                  var form = $(page).find('form');
                  $(form).hide();
                  $(form).appendTo( d );

                  $(d).dialog({
                    title: $(this).formatString( lang.deleteAttachmentDialogTitle, filename ),
                    closeOnEscape: true,
                    modal: true,
                    width: 450,
                    height: 150,
                    show: {
                      effect: 'fade',
                      duration: 500
                    },
                    hide: {
                      effect: 'fade',
                      duration: 300
                    },
                    buttons: [
                      {
                        text: lang.btnDeleteText,
                        click: function() {
                          $(form).find('input.foswikiSubmit').click();
                          $(this).dialog('close');
                        }
                      },
                      {
                        text: lang.btnCancelText,
                        click: function() {
                          $(this).dialog('close');
                        }
                      }
                    ]
                  });
                }
              });
            }
          },

          sep3: "---------",

          'comment': {
            name: lang.editComment,
            icon: 'comment',
            disabled: !kvpCanEdit,
            callback: function( key, opts ){
              var attachUrl = $(this).formatString(
                "{0}/attach{1}/{2}/{3}?filename={4}",
                binPath,
                scriptSuffix,
                web,
                topic,
                filename
              );

              $(this).blockUI();
              $.ajax({
                url: attachUrl,
                complete: function( xhr, status ) {
                  $(this).unblockUI();
                },
                error: function( xhr, status, error ) {
                  $(this).createErrorDialog();
                  $(this).logError( error );
                },
                success: function( page, status, xhr ) {
                  if ( $(this).isLoginForm( page ) ) return;
                  var form = $(page).find('form.modacUpload');
                  $(form).find('div.patternBorder').hide();
                  var steps = $(form).find('div.foswikiFormSteps').children();
                  $(steps).first().hide();
                  $(steps).last().hide();
                  var d = $('<div></div>');
                  $(form).appendTo( d );

                  $(d).dialog({
                    title: lang.editCommentDialogTitle,
                    closeOnEscape: true,
                    modal: true,
                    minWidth: 600,
                    minHeight: 150,
                    show: {
                      effect: 'fade',
                      duration: 500
                    },
                    hide: {
                      effect: 'fade',
                      duration: 300
                    },
                    buttons: [
                      {
                        text: lang.btnSaveText,
                        click: function() {
                          $(d).find('input.modacChanging').click();
                          $(this).dialog('close');
                        }
                      },
                      {
                        text: lang.btnCancelText,
                        click: function() {
                          $(this).dialog('close');
                        }
                      }
                    ]
                  });
                }
              });
            }
          }
        }
      };

      var lockedMenu = {
        className: 'data-title',
        items: {
          'edit': {
            name: hasHandler
                    ? $(this).formatString( lang.editAttachmentIn, componentName )
                    : lang.editAttachment,
            icon: 'locked',
            disabled: true
          },

          'download': {
            name: lang.downloadAttachment,
            icon: 'download',
            callback: function( key, opts ) {
              window.location.href = href;
            }
          },

          sep1: "---------",

          'newversion': {
            name: lang.newVersion,
            disabled: true,
            icon: 'locked'
          },

          'versions': {
            name: lang.manageVersions,
            disabled: true,
            icon: 'locked'
          },

          sep2: "---------",

          'move': {
            name: lang.moveAttachment,
            disabled: true,
            icon: 'locked'
          },

          'rename': {
            name: lang.renameAttachment,
            disabled: true,
            icon: 'locked'
          },

          'delete': {
            name: lang.deleteAttachment,
            disabled: true,
            icon: 'locked'
          },

          sep3: "---------",

          'comment': {
            name: lang.editComment,
            icon: 'comment',
            disabled: !kvpCanEdit,
            callback: function( key, opts ){
              var attachUrl = $(this).formatString(
                "{0}/attach{1}/{2}/{3}?filename={4}",
                binPath,
                scriptSuffix,
                web,
                topic,
                filename
              );

              $(this).blockUI();
              $.ajax({
                url: attachUrl,
                complete: function( xhr, status ) {
                  $(this).unblockUI();
                },
                error: function( xhr, status, error ) {
                  $(this).createErrorDialog();
                  $(this).logError( error );
                },
                success: function( page, status, xhr ) {
                  if ( $(this).isLoginForm( page ) ) return;
                  var form = $(page).find('form.modacUpload');
                  $(form).find('div.patternBorder').hide();
                  var steps = $(form).find('div.foswikiFormSteps').children();
                  $(steps).first().hide();
                  $(steps).last().hide();
                  var d = $('<div></div>');
                  $(form).appendTo( d );

                  $(d).dialog({
                    title: lang.editCommentDialogTitle,
                    closeOnEscape: true,
                    modal: true,
                    minWidth: 600,
                    minHeight: 150,
                    show: {
                      effect: 'fade',
                      duration: 500
                    },
                    hide: {
                      effect: 'fade',
                      duration: 300
                    },
                    buttons: [
                      {
                        text: lang.btnSaveText,
                        click: function() {
                          $(d).find('input.modacChanging').click();
                          $(this).dialog('close');
                        }
                      },
                      {
                        text: lang.btnCancelText,
                        click: function() {
                          $(this).dialog('close');
                        }
                      }
                    ]
                  });
                }
              });
            }
          }
        }
      };

      $this.contextMenu({
        selector: 'a',
        trigger: 'left',
        build: function( trigger, e ) {
          var icon = $(td).find('img');
          var origSrc = $(icon).attr( 'src' );
          $(icon).attr( 'src', '/pub/System/ModacContextMenuPlugin/images/ajax-loader.gif' );

          var restUrl = $(this).formatString(
            "{0}/rest{1}/ModacContextMenuPlugin/isLocked?w={2}&t={3}&a={4}",
            binPath,
            scriptSuffix,
            web,
            topic,
            filename
          );

          var result = $.ajax( {
            url: restUrl,
            async: false
          } );

          var response = $.parseJSON( result.responseText );
          console.log( response );
          $('.data-title').livequery( function() {
            var menu = this;
            var owner = response.owner;
            $(menu).attr( 'data-menutitle', $(this).formatString( lang.lockedBy, owner ) );
            if ( response.owner ) $('.data-title').expire();
          });

          $(icon).attr( 'src', origSrc );
          return response.isLocked ? lockedMenu : regularMenu;
        }
      });
    },

    blockUI: function() {
      var lang = contextMenuStrings.lang;
      $.blockUI({
        message: $(this).formatString( '<h1>{0}</h1>', lang.blockUIMessage )
      });
    },

    checkFirefoxAddOn: function() {
      var img = document.createElement( 'img' );
      img.addEventListener( 'load', function( e ) {
        foswiki.hasFFAddon = true;
      }, false );

      img.addEventListener( 'error', function( e ) {
        foswiki.hasFFAddon = false;
      }, false);

      img.setAttribute( 'src', 'chrome://msolink/skin/icon.png' );
    },

    createErrorDialog: function() {
      var lang = contextMenuStrings.lang;
      var d = $('<div></div>');
      $(d).text( lang.oopsText );
      $(d).dialog({
        title: lang.oopsTitle,
        closeOnEscape: true,
        width: 400,
        height: 150,
        show: {
          effect: 'fade',
          duration: 500
        },
        hide: {
          effect: 'fade',
          duration: 300
        },
        buttons: [
          {
            text: lang.btnCancelText,
            click: function() {
              $(this).dialog('close');
            }
          }
        ]
      });
    },

    createFirefoxAddonDialog: function() {
      var lang = contextMenuStrings.lang;
      var d = $('<div></div>');
      var a = '<a href="https://addons.mozilla.org/de/firefox/addon/qwiki-webdav/" title="Firefox Extension" target="_blank"></a>';
      var text = $(this).formatString( lang.webdavHintText, a );
      $(d).html( text );
      $(d).find('a').text( lang.webdavLinkText );

      $(d).dialog({
        title: lang.webdavHintTitle,
        width: 550,
        height: 150,
        resizable: false,
        modal: true,
        show: {
          effect: 'fade',
          duration: 500
        },
        hide: {
          effect: 'fade',
          duration: 300
        },
        buttons: [
          {
            text: lang.btnCloseText,
            click: function() {
              $(this).dialog('close');
            }
          }
        ]
      });
    },

    createLoginDialog: function( loginForm ) {
      var lang = contextMenuStrings.lang;
      var d = $('<div></div>');
      $(loginForm).find('div.foswikiFormStep:first').hide();
      $(loginForm).find('input.foswikiSubmit').parent().parent().hide();

      $(loginForm).appendTo( d );
      $(d).dialog({
        title: lang.loginRequiredTitle,
        width: 600,
        height: 325,
        closeOnEscape: true,
        modal: true,
        resizable: false,
        show: {
          effect: 'fade',
          duration: 500
        },
        hide: {
          effect: 'fade',
          duration: 300
        },
        buttons: [
          {
            text: lang.btnLoginText,
            click: function() {
              $(loginForm).find('input.foswikiSubmit').click();
              $(this).dialog('close');
            }
          },
          {
            text: lang.btnCancelText,
            click: function() {
              $(this).dialog('close');
            }
          }
        ]
      });
    },

    formatString: function() {
      if ( !String.prototype.format ) {
        String.prototype.format = function() {
          var args = arguments;
          return this.replace( /{(\d+)}/g, function( match, number ) {
            return typeof args[number] != 'undefined'
              ? args[number]
              : match;
          });
        };
      }

      var args = Array.prototype.slice.call( arguments )
      return String.prototype.format.apply( args.shift(), args );
    },

    getOfficeApps: function() {
      var prefs = foswiki.getPreference( 'contextMenu' );
      var apps = unescape( prefs.apps );

      if ( apps == null || apps == '' ) {
        $(this).logError( "No Office apps specified." );
        return null;
      }

      return $.parseJSON( apps );
    },

    getWebDAVUrl: function() {
      var prefs = foswiki.getPreference( 'contextMenu' );
      if ( !prefs.davHasUrl ) {
        $(this).logError( "No WebDAV location specified." );
        return null;
      }

      return unescape( prefs.davUrl );
    },

    isLoginForm: function( page ) {
      var loginForm = $(page).find('#foswikiLogin');
      if ( $(loginForm).length == 0 ) return false;
      $(this).createLoginDialog( loginForm );
      return true;
    },

    isSupportedBrowser: function() {
      var isIE = $.browser.msie;
      var isFF = $.browser.mozilla;
      var hasActiveX = typeof(ActiveXObject) != "undefined";
      var isSupported = isFF || (isIE && hasActiveX);
      return isSupported;
    },

    kvpIsEnabled: function() {
      var prefs = foswiki.getPreference( 'contextMenu' );
      if ( prefs == null ) return false;
      return prefs.kvpIsEnabled;
    },

    kvpCanEdit: function() {
      var prefs = foswiki.getPreference( 'contextMenu' );
      if ( prefs == null ) return false;
      return prefs.kvpCanEdit;
    },

    kvpCanMove: function() {
      var prefs = foswiki.getPreference( 'contextMenu' );
      if ( prefs == null ) return false;
      return prefs.kvpCanMove;
    },

    logError: function( msg ) {
      window.console ? console.error( msg ) : alert( msg );
    },

    unblockUI: function() {
      $.unblockUI();
    },

    webdavInvokeFF: function( e ) {
      var ev = document.createEvent( 'Events' );
      ev.initEvent( 'webdav_open', true, true );
      e.currentTarget.dispatchEvent( ev );
      return false;
    },

    webdavInvokeIE: function( officeComponent, url ) {
      if ( typeof(ActiveXObject) != "undefined" ) {
        var parts = officeComponent.split( '.' );
        var launcher = new ActiveXObject( parts[0] + '.Application' );
        var docType = null;
        if ( launcher != null ) {
          docType = launcher[parts[1]];
        }

        if ( docType != null ) {
          launcher.Visible = true;
          docType.Open( url );
        }
      }

      return false;
    }
  });

  $(document).ready( function() {
    // Testing
    var imgs = $('img.modacBookmarkStar');
    $.each( imgs, function( index, img ) {
      var goldPattern = /gold/;
      var src = $(img).attr( 'src' );
      var newSrc = '/pub/System/ModacContextMenuPlugin/images/star_{0}.png';
      newSrc = $(this).formatString( newSrc, goldPattern.test( src ) ? 'remove' : 'add' );
      $(img).on( 'mouseenter', function() {
        $(img).attr( 'src', newSrc );
      });

      $(img).on( 'mouseleave', function() {
        $(img).attr( 'src', src );
      });
    });
    // Testing

    var container = $('div.foswikiAttachments');
    if ( $(container).length == 0 ) return;

    if ( $.browser.mozilla ) {
      $(this).checkFirefoxAddOn();
      var body = $('body');
      var hidden = '<div id="hiddenContainer" style="display:none;"></div>';
      $(hidden).appendTo( body );
    }

    var table = $(container).find('table');
    var tds = $(table).find('td.foswikiTableCol1');
    $.each( tds, function( index, td ) {
      $(this).attachContextMenu( td );
    });
  });

})(jQuery);
