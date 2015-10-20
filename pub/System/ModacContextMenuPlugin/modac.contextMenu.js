var ContextMenu = function() {
    if (!window.foswiki.ModacContextMenuPluginLang) {
        // window.console && console.log( 'No language specified.' );
        return;
    }

    var entries = [];
    var lang = window.foswiki.ModacContextMenuPluginLang;

    /**
     * Foswiki preferences
     **/

    var prefs = foswiki.getPreference('contextMenu');
    var pubPath = foswiki.getPreference('PUBURLPATH');
    var binPath = foswiki.getPreference('SCRIPTURLPATH');
    var scriptSuffix = foswiki.getPreference('SCRIPTSUFFIX');
    var web = foswiki.getPreference('WEB');
    var topic = foswiki.getPreference('TOPIC');


    /**
     * KVP
     **/

    var kvpIsEnabled = prefs.kvpIsEnabled;
    var kvpCanEdit = kvpIsEnabled ? prefs.kvpCanEdit : true;
    var kvpCanMove = kvpIsEnabled ? prefs.kvpCanMove : true;


    /**
     * WebDAV
     **/

    var getOfficeApps = function() {
        if (!prefs.davIsEnabled) return null;
        var apps = unescape(prefs.apps);
        if (apps == null || apps == '') {
            $(this).logError("No Office apps specified.");
            return null;
        }

        return $.parseJSON(apps);
    };

    var getWebDAVUrl = function() {
        if (!prefs.davIsEnabled) return null;
        if (!prefs.davHasUrl) {
            $(this).logError("No WebDAV location specified.");
            return null;
        }

        return unescape(prefs.davUrl);
    };

    var isChrome = /Chrome/.test(navigator.userAgent);
    var isFirefox = /Firefox/.test(navigator.userAgent);
    var isIE = /MSIE|Trident/.test(navigator.userAgent);

    var isSupportedBrowser = function() {
        var isSupported = isFirefox || isIE || isChrome;
        return isSupported;
    };

    var davEnabledBrowser = isSupportedBrowser();
    var davUrl = getWebDAVUrl();
    var hasDavUrl = davUrl != null;
    var apps = getOfficeApps();
    var hasApps = apps != null;

    // jQuery override - provides localized loading messages
    var blockUI = function() {
        $.blockUI({
            message: formatString('<h1>{0}</h1>', lang.blockUIMessage)
        });
    };

    var buildRegularMenu = function(defaultItems, kvpCanEdit) {
        var items = defaultItems.slice();
        for (var i = 0; i < entries.length; ++i) {
            var entry = entries[i];

            if (typeof(entry.data) == 'object' && entry.opts.honorsKVP) {
                entry.data.disabled = !kvpCanEdit;
            }

            items.splice(entry.opts.position, 0, entry.data);
        }

        var regularMenu = {};
        for (var i = 0; i < items.length; ++i) {
            var entry = items[i];
            regularMenu[i] = entry;
        }

        return regularMenu;
    };

    var buildLockedMenu = function(lockedItems, locked) {
        var items = lockedItems.slice();

        var lockableEntries = entries.slice();
        for (var i = 0; i < lockableEntries.length; ++i) {
            var entry = lockableEntries[i];

            if (locked && typeof(entry.data) == 'object' && entry.opts.lockable) {
                entry.data.disabled = true;
            }

            items.splice(entry.opts.position, 0, entry.data);
        }

        var lockedMenu = {};
        for (var i = 0; i < items.length; ++i) {
            var entry = items[i];
            lockedMenu[i] = entry;
        }

        return lockedMenu;
    };

    // tries to access a public resource of FF's qwiki-webdav addon.
    // will fail when not available (not installed, not FF at all)
    var checkFirefoxAddOn = function() {
        document.body.addEventListener('qwiki.webdav.mozaddon', function(evt) {
            foswiki.hasFFAddon = true;
        });

        var ev = new CustomEvent('qwiki.webdav.hasmozaddon');
        document.body.dispatchEvent(ev);
    };

    // see above
    var checkChromeAddOn = function() {
        document.body.addEventListener('qwiki.webdav.chromeaddon', function(evt) {
            foswiki.hasChromeAddon = true;
        });

        var ev = new CustomEvent('qwiki.webdav.haschromeaddon');
        document.body.dispatchEvent(ev);
    };

    var createErrorDialog = function() {
        var d = $('<div></div>');
        $(d).text(lang.oopsText);
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
            buttons: [{
                text: lang.btnCancelText,
                click: function() {
                    $(this).dialog('close');
                }
            }]
        });
    };

    // show a hint when the user is on FF but is not using qwiki-webdav addon
    var createFirefoxAddonDialog = function() {
        var d = $('<div></div>');
        var a = '<a href="https://addons.mozilla.org/de/firefox/addon/qwiki-webdav/" title="Firefox Extension" target="_blank"></a>';
        var text = formatString(lang.webdavFFHintText, a);
        $(d).html(text);
        $(d).find('a').text(lang.webdavFFLinkText);

        $(d).dialog({
            title: lang.webdavFFHintTitle,
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
            buttons: [{
                text: lang.btnCloseText,
                click: function() {
                    $(this).dialog('close');
                }
            }]
        });
    };

    // same as above but for Google's Chrome
    var createChromeAddonDialog = function() {
        var d = $('<div></div>');
        var a = '<a href="https://chrome.google.com/webstore/detail/qwiki-office-connector/khjnieflpflngolekdehbnglfbfmfeoa?authuser=1" title="Google Chrome Extension" target="_blank"></a>';
        var text = formatString(lang.webdavChromeHintText, a);
        $(d).html(text);
        $(d).find('a').text(lang.webdavChromeLinkText);

        $(d).dialog({
            title: lang.webdavChromeHintTitle,
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
            buttons: [{
                text: lang.btnCloseText,
                click: function() {
                    $(this).dialog('close');
                }
            }]
        });
    };

    // shows a login dialog.
    // called when the user tries to call an access restricted method (e.g. view history)
    var createLoginDialog = function(loginForm) {
        var d = $('<div></div>');
        $(loginForm).find('div.foswikiFormStep:first').hide();
        $(loginForm).find('input.foswikiSubmit').parent().parent().hide();

        $(loginForm).appendTo(d);
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
            buttons: [{
                text: lang.btnLoginText,
                click: function() {
                    $(loginForm).find('input.foswikiSubmit').click();
                    $(this).dialog('close');
                }
            }, {
                text: lang.btnCancelText,
                click: function() {
                    $(this).dialog('close');
                }
            }]
        });
    };

    // Helper. Provides a String.prototype to support format strings
    // e.g. $(this).formatString( "Hello {0}! My name is {1}.", "World", "Mr. Foo" );
    var formatString = function() {
        if (!String.prototype.format) {
            String.prototype.format = function() {
                var args = arguments;
                return this.replace(/{(\d+)}/g, function(match, number) {
                    return typeof args[number] != 'undefined' ? args[number] : match;
                });
            };
        }

        var args = Array.prototype.slice.call(arguments)
        return String.prototype.format.apply(args.shift(), args);
    };

    var isLoginForm = function(page) {
        var loginForm = $(page).find('#foswikiLogin');
        if ($(loginForm).length == 0) return false;
        $(this).createLoginDialog(loginForm);
        return true;
    };


    // fires an event (which will be handled by qwiki-webdav addon)
    // in order to launch Office
    // Mozilla only
    var webdavInvoke = function(e) {
        var ev = new CustomEvent('qwiki.webdav.open', {'detail': e.currentTarget.href});
        document.body.dispatchEvent(ev);
        return false;
    };

    // Start Office app by using ActiveX
    // see http://msdn.microsoft.com/de-de/library/ie/7sw4ddf8(v=vs.94).aspx
    // IE only
    var webdavInvokeIE = function(officeComponent, url, isTemplate) {
        var parts = officeComponent.split('.');

        // Fix object class for MS Project
        // DO NOT CHANGE the term 'Project' to 'MSProject' within Config.spec!
        // The context menu action strings are built from the object class
        // identifiers (e.g. Open in Word/Excel/Visio/Project...)
        if (parts[0] == 'Project') parts[0] = 'MSProject';
        var launcher = new ActiveXObject(parts[0] + '.Application');

        switch (parts[0]) {
            case 'Access':
                launcher.Visible = true;
                launcher.OpenCurrentDatabase(url, false);
                break;
            case 'MSProject':
                launcher.Visible = true;
                launcher.Application.FileOpen(url, false);
                break;
            case 'Publisher':
                launcher.ActiveWindow.Visible = true;
                launcher.Open(url, false);
                break;
            default:
                var docType = null;
                if (launcher != null) {
                    docType = launcher[parts[1]];
                }

                if (docType != null) {
                    launcher.Visible = true;

                    if (isTemplate) {
                        docType.Add(url);
                    } else {
                        docType.Open(url);
                    }

                }
        }

        return event.preventDefault;
    };

    ContextMenu.prototype.addEntry = function(entry, opts) {
        var options = {
            honorsKVP: true,
            lockable: true,
            position: 13 + entries.length // there are 13 default items.
        };

        if (!opts) opts = {};
        $.extend(options, opts);

        var e = {
            opts: options,
            data: entry
        };
        entries.splice(options.position, 0, e);
    };

    ContextMenu.prototype.attachContextMenu = function(td, topicInteraction) {
        var $this = $(td);

        // attach to second column of attachments table.
        var $a = $this.find('a');
        var href = $a.attr('href');
        var deleteUrl = $a.data('delete-url') || $a.attr('data-delete-url') || '';
        var pattern = /.*\/(.+)$/;
        var filename;
        var match = pattern.exec(href);
        if (match != null && match.length > 1) {
            filename = match[1];
        } else {
            // will produce HTTP 500 -> error dialog
            filename = '#';
        }

        var hasHandler = false;
        var component, componentName, extension;
        for (var app in apps) {
            var exts = new RegExp("\\.(" + apps[app] + ")$", 'i');
            if (exts.test(href)) {
                hasHandler = true;
                componentName = app.split('.')[0];
                component = app;

                try {
                    extension = href.match(exts)[1];
                } catch (e) {
                    extension = null;
                }

                break;
            }
        }

        // check whether the currently processed file refers to an office template.
        var isTemplate = false;
        if (hasHandler && extension) {
            var templates = new RegExp("^(dot|dotm|dotx|pot|potm|potx|xlt|xltm|xltx|vst|vstm|vstx)$", 'i');
            isTemplate = templates.test(extension);
        }

        var isEditEnabled = davEnabledBrowser && hasApps && kvpCanEdit && hasDavUrl && hasHandler;

        /*
         * regular menu
         */
        var edit = {
            name: isEditEnabled ? formatString(lang.editAttachmentIn, componentName) : lang.editAttachment,
            icon: 'edit',
            disabled: !isEditEnabled,
            callback: function(key, opts) {
                if (window.kvpDiscussionConfirmation && !window.kvpDiscussionConfirmation()) return false;

                var restUrl = formatString(
                    "{0}/rest{1}/ModacContextMenuPlugin/tokenizer?w={2}&t={3}&a={4}",
                    binPath,
                    scriptSuffix,
                    web,
                    topic,
                    filename
                );

                $.ajax({url: restUrl, cache: false}).done(function(data, status, xhr) {
                    var token = xhr.getResponseHeader('X-MA-TOKEN');
                    if (!token) {
                        if (window.console && window.console.error) {
                            console.error('Missing token!');
                        }
                        return;
                    }

                    var newTopic = topic + '_files'; // hard corded in FilesysVirtual
                    var davHref = href.replace(topic, newTopic).replace(pubPath, davUrl + '/' + token);
                    davHref = decodeURI( davHref );

                    if (isIE) {
                        return webdavInvokeIE(component, davHref, false);
                    }

                    if (isFirefox || isChrome) {
                        if (isFirefox && !foswiki.hasFFAddon) {
                           createFirefoxAddonDialog();
                           return;
                        }

                        if (isChrome && !foswiki.hasChromeAddon) {
                           createChromeAddonDialog();
                           return;
                        }

                        var div = document.getElementById('hiddenContainer');
                        var a = document.createElement('a');

                        a.setAttribute('href', davHref);
                        div.appendChild(a);

                        a.onclick = function(e) {
                            return webdavInvoke(e);
                        };

                        a.click();
                    }
                }).fail(function(xhr, status, err) {
                    if (window.console && window.console.error) {
                        console.error('Acquiring token failed!');
                        console.error(err);
                    }
                });
            }
        };

        var fromTemplate = {
            name: lang.useAsTemplate,
            icon: 'template',
            disabled: !(isTemplate && isIE),
            callback: function(key, opts) {
                return webdavInvokeIE(component, davHref, true);
            }
        };

        var download = {
            name: lang.downloadAttachment,
            icon: 'download',
            callback: function(key, opts) {
                var cm = foswiki.getPreference('contextMenu');
                if ( cm.newWindow ) {
                    window.open(href);
                } else {
                    window.location.href = href;
                }
            }
        };

        var newversion = {
            name: lang.newVersion,
            icon: 'newversion',
            disabled: !kvpCanEdit,
            callback: function(key, opts) {
                if (window.kvpDiscussionConfirmation && !window.kvpDiscussionConfirmation()) return false;
                var attachUrl = formatString(
                    "{0}/attach{1}/{2}/{3}?filename={4}",
                    binPath,
                    scriptSuffix,
                    encodeURI(web),
                    encodeURI(topic),
                    filename
                );

                blockUI();
                $.ajax({
                    url: attachUrl,
                    complete: function(xhr, status) {
                        $.unblockUI();
                    },
                    error: function(xhr, status, error) {
                        createErrorDialog();
                        window.console && console.log(error);
                    },
                    success: function(page, status, xhr) {
                        if (isLoginForm(page)) return;
                        var form = $(page).find('form.modacUpload');
                        var d = $('<div></div>');
                        $(form).appendTo(d);

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
                            buttons: [{
                                text: lang.btnUploadText,
                                click: function() {
                                    $(d).find('input.foswikiSubmit').click();
                                    $(this).dialog('close');
                                }
                            }, {
                                text: lang.btnCancelText,
                                click: function() {
                                    $(this).dialog('close');
                                }
                            }]
                        });
                    }
                });
            }
        };

        var versions = {
            name: lang.manageVersions,
            icon: 'versions',
            disabled: !kvpCanEdit,
            callback: function(key, opts) {
                var attachUrl = formatString(
                    "{0}/attach{1}/{2}/{3}?filename={4}",
                    binPath,
                    scriptSuffix,
                    encodeURI(web),
                    encodeURI(topic),
                    filename
                );

                blockUI();
                $.ajax({
                    url: attachUrl,
                    complete: function(xhr, status) {
                        $.unblockUI();
                    },
                    error: function(xhr, status, error) {
                        createErrorDialog();
                        logError(error);
                    },
                    success: function(page, status, xhr) {
                        if (isLoginForm(page)) return;
                        var form = $(page).find('div.foswikiAttachments');
                        var d = $('<div></div>');
                        $(d).html(form);

                        $(d).dialog({
                            title: formatString(lang.manageVersionsDialogTitle, filename),
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
                            buttons: [{
                                text: lang.btnCloseText,
                                click: function() {
                                    $(this).dialog('close');
                                }
                            }]
                        });
                    }
                });
            }
        };

        var move = {
            name: lang.moveAttachment,
            icon: 'move',
            disabled: !kvpCanMove,
            callback: function(key, opts) {
                var moveUrl = formatString(
                    "{0}/rename{1}/{2}/{3}?template=moveattachment&attachment={4}",
                    binPath,
                    scriptSuffix,
                    encodeURI(web),
                    encodeURI(topic),
                    filename
                );

                blockUI();
                $.ajax({
                    url: moveUrl,
                    complete: function(xhr, status) {
                        $.unblockUI();
                    },
                    error: function(xhr, status, error) {
                        createErrorDialog();
                        window.console && console.log(error);
                    },
                    success: function(page, status, xhr) {
                        if (isLoginForm(page)) return;
                        var form = $(page).find('form').last();
                        $(form).find('div.patternBorder').hide();
                        $(form).find('div.foswikiFormSteps').children().first().hide();
                        var d = $('<div></div>');
                        $(form).appendTo(d);

                        $(d).dialog({
                            title: formatString(lang.moveAttachmentDialogTitle, filename),
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
                            buttons: [{
                                text: lang.btnMoveText,
                                click: function() {
                                    $(form).find('input.foswikiSubmit').click();
                                    $(this).dialog('close');
                                }
                            }, {
                                text: lang.btnCancelText,
                                click: function() {
                                    $(this).dialog('close');
                                }
                            }]
                        });
                    }
                });
            }
        };

        var rename = {
            name: lang.renameAttachment,
            icon: 'rename',
            disabled: !kvpCanEdit,
            callback: function(key, opts) {
                var moveUrl = formatString(
                    "{0}/rename{1}/{2}/{3}?template=moveattachment&attachment={4}",
                    binPath,
                    scriptSuffix,
                    encodeURI(web),
                    encodeURI(topic),
                    filename
                );

                blockUI();
                $.ajax({
                    url: moveUrl,
                    complete: function(xhr, status) {
                        $.unblockUI();
                    },
                    error: function(xhr, status, error) {
                        createErrorDialog();
                        window.console && console.log(error);
                    },
                    success: function(page, status, xhr) {
                        if (isLoginForm(page)) return;
                        var form = $(page).find('form').last();
                        $(form).find('div.patternBorder').hide();
                        $(form).find('div.foswikiFormStep:lt(3)').hide();
                        $(form).find('input.foswikiInputField').first().val(topic);
                        var d = $('<div></div>');
                        $(form).appendTo(d);

                        $(d).dialog({
                            title: formatString(lang.renameAttachmentDialogTitle, filename),
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
                            buttons: [{
                                text: lang.btnRenameText,
                                click: function() {
                                    $(form).find('input.foswikiSubmit').click();
                                    $(this).dialog('close');
                                }
                            }, {
                                text: lang.btnCancelText,
                                click: function() {
                                    $(this).dialog('close');
                                }
                            }]
                        });
                    }
                });
            }
        };

        var remove = {
            name: lang.deleteAttachment,
            icon: 'delete',
            disabled: !kvpCanEdit,
            callback: function(key, opts) {
                var trashWeb = foswiki.getPreference('contextMenu').trashWeb;
                if ( !deleteUrl || /^[\s\r\n]*$/.test(deleteUrl) ) {
                    deleteUrl = formatString(
                        "{0}/rename{1}/{2}/{3}?newweb={4};newtopic=TrashAttachment;template=renameattachmentdelete;attachment={5}",
                        binPath,
                        scriptSuffix,
                        encodeURI(web),
                        encodeURI(topic),
                        trashWeb,
                        filename
                    );
                }

                blockUI();
                $.ajax({
                    url: deleteUrl,
                    complete: function(xhr, status) {
                        $.unblockUI();
                    },
                    error: function(xhr, status, error) {
                        createErrorDialog();
                        window.console && console.log(error);
                    },
                    success: function(page, status, xhr) {
                        if (isLoginForm(page)) return;
                        var d = $(formatString('<div>{0}</div>', lang.deleteAttachmentDialogText));
                        var form = $(page).find('form');
                        $(form).hide();
                        $(form).appendTo(d);

                        $(d).dialog({
                            title: formatString(lang.deleteAttachmentDialogTitle, filename),
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
                            buttons: [{
                                text: lang.btnDeleteText,
                                click: function() {
                                    $(form).find('input.foswikiSubmit').click();
                                    $(this).dialog('close');
                                }
                            }, {
                                text: lang.btnCancelText,
                                click: function() {
                                    $(this).dialog('close');
                                }
                            }]
                        });
                    }
                });
            }
        };

        var comment = {
            name: lang.editComment,
            icon: 'comment',
            disabled: !kvpCanEdit,
            callback: function(key, opts) {
                var attachUrl = formatString(
                    "{0}/attach{1}/{2}/{3}?filename={4}",
                    binPath,
                    scriptSuffix,
                    encodeURI(web),
                    encodeURI(topic),
                    filename
                );

                blockUI();
                $.ajax({
                    url: attachUrl,
                    complete: function(xhr, status) {
                        $.unblockUI();
                    },
                    error: function(xhr, status, error) {
                        createErrorDialog();
                        window.console && console.log(error);
                    },
                    success: function(page, status, xhr) {
                        if (isLoginForm(page)) return;
                        var form = $(page).find('form.modacUpload');
                        $(form).find('div.patternBorder').hide();
                        var steps = $(form).find('div.foswikiFormSteps').children();
                        $(steps).first().hide();
                        $(steps).last().hide();
                        var d = $('<div></div>');
                        $(form).appendTo(d);

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
                            buttons: [{
                                text: lang.btnSaveText,
                                click: function() {
                                    $(d).find('input.modacChanging').click();
                                    $(this).dialog('close');
                                }
                            }, {
                                text: lang.btnCancelText,
                                click: function() {
                                    $(this).dialog('close');
                                }
                            }]
                        });
                    }
                });
            }
        };

        var defaultItems = [
            edit,
            fromTemplate,
            '---------',
            download,
            '---------',
            newversion,
            versions,
            '---------',
            move,
            rename,
            remove,
            '---------',
            comment
        ];


        /*
         * locked menu
         */
        var editLocked = {
            name: hasHandler ? formatString(lang.editAttachmentIn, componentName) : lang.editAttachment,
            icon: 'locked',
            disabled: true
        };

        var downloadLocked = {
            name: lang.downloadAttachment,
            icon: 'download',
            callback: function(key, opts) {
                var cm = foswiki.getPreference('contextMenu');
                if ( cm.newWindow ) {
                    window.open(href);
                } else {
                    window.location.href = href;
                }
            }
        };

        var newversionLocked = {
            name: lang.newVersion,
            disabled: true,
            icon: 'locked'
        };

        var versionsLocked = {
            name: lang.manageVersions,
            disabled: true,
            icon: 'locked'
        };

        var moveLocked = {
            name: lang.moveAttachment,
            disabled: true,
            icon: 'locked'
        };

        var renameLocked = {
            name: lang.renameAttachment,
            disabled: true,
            icon: 'locked'
        };

        var deleteLocked = {
            name: lang.deleteAttachment,
            disabled: true,
            icon: 'locked'
        };

        var commentLocked = {
            name: lang.editComment,
            icon: 'comment',
            disabled: !kvpCanEdit,
            callback: function(key, opts) {
                var attachUrl = formatString(
                    "{0}/attach{1}/{2}/{3}?filename={4}",
                    binPath,
                    scriptSuffix,
                    encodeURI(web),
                    encodeURI(topic),
                    filename
                );

                blockUI();
                $.ajax({
                    url: attachUrl,
                    complete: function(xhr, status) {
                        $.unblockUI();
                    },
                    error: function(xhr, status, error) {
                        createErrorDialog();
                        window.console && console.log(error);
                    },
                    success: function(page, status, xhr) {
                        if (isLoginForm(page)) return;
                        var form = $(page).find('form.modacUpload');
                        $(form).find('div.patternBorder').hide();
                        var steps = $(form).find('div.foswikiFormSteps').children();
                        $(steps).first().hide();
                        $(steps).last().hide();
                        var d = $('<div></div>');
                        $(form).appendTo(d);

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
                            buttons: [{
                                text: lang.btnSaveText,
                                click: function() {
                                    $(d).find('input.modacChanging').click();
                                    $(this).dialog('close');
                                }
                            }, {
                                text: lang.btnCancelText,
                                click: function() {
                                    $(this).dialog('close');
                                }
                            }]
                        });
                    }
                });
            }
        }

        var lockedItems = [
            editLocked,
            fromTemplate,
            '---------',
            downloadLocked,
            '---------',
            newversionLocked,
            versionsLocked,
            '---------',
            moveLocked,
            renameLocked,
            deleteLocked,
            '---------',
            commentLocked
        ];


        // build the context menu each time the user clicks an (attachtable) entry.
        $this.contextMenu({
            selector: 'a',
            trigger: 'left',
            build: function(trigger, e) {
                var icon = $(td).find('img');
                var origSrc = $(icon).attr('src');
                $(icon).attr('src', '/pub/System/ModacContextMenuPlugin/images/ajax-loader.gif');

                var restUrl = formatString(
                    "{0}/rest{1}/ModacContextMenuPlugin/isLocked?w={2}&t={3}&a={4}",
                    binPath,
                    scriptSuffix,
                    encodeURI(web),
                    encodeURI(topic),
                    filename
                );

                var result = $.ajax({
                    url: restUrl,
                    async: false
                });

                var response = $.parseJSON(result.responseText);
                $('.data-title').livequery(function() {
                    var menu = this;
                    var owner = response.owner;
                    $(menu).attr('data-menutitle', formatString(lang.lockedBy, owner));
                    if (response.owner) $('.data-title').expire();
                });

                $(icon).attr('src', origSrc);

                var regular = {
                    items: buildRegularMenu(defaultItems, kvpCanEdit)
                };
                var locked = {
                    className: 'data-title',
                    items: buildLockedMenu(lockedItems, response.isLocked)
                };
                return response.isLocked ? locked : regular;
            }
        });
    };

    ContextMenu.prototype.addSeparator = function(position) {
        if (!position) position = entries.length + 11;

        var sep = {
            opts: {
                position: position
            },
            data: '---------'
        };
        entries.splice(position, 0, sep);
    };

    ContextMenu.prototype.removeItem = function(position) {
        return null;
    };

    if (isChrome || isFirefox) {
        // Attach an invisible container.
        if (isFirefox)
            checkFirefoxAddOn();
        if (isChrome)
            checkFirefoxAddOn();

        var hidden = '<div id="hiddenContainer" style="display:none;"></div>';
        $(hidden).appendTo('body');
    }
};

(function($) {
    $(document).ready(function() {
        window.foswiki.ModacContextMenuPlugin = new ContextMenu();
        var cm = foswiki.getPreference('contextMenu');
        if ( !cm.useContextMenu ) {
            return;
        }

        var ti = cm.topicInteraction;

        if (!ti) {
            var table = $('div.foswikiAttachments').find('table');
            var tds = $(table).find('td.foswikiTableCol1');
            $.each(tds, function(i, e) {
                foswiki.ModacContextMenuPlugin.attachContextMenu(e);
            });
        } else {
            var container = $('div.foswikiAttachmentName');
            container.each(function(i, e) {
                foswiki.ModacContextMenuPlugin.attachContextMenu(e);
            });
        }
    });
})(jQuery);
