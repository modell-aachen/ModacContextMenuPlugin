// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

var msolink = {
  copyright: "2013 Modell Aachen GmbH, http://www.modell-aachen.de",
  version: "1.1.0",

  WORD: { value: 0, name: "winword.exe" },
  EXCEL: { value: 1, name: "excel.exe" },
  POWERPOINT: { value: 2, name: "powerpnt.exe" },
  PUBLISHER: { value: 3, name: "mspub.exe" },
  MSPROJECT: { value: 4, name: "winproj.exe" },
  VISIO: { value: 5, name: "visio.exe" },
  ACCESS: { value: 6, name: "msaccess.exe" },

  init: function() {
    var appcontent = document.getElementById( "appcontent" );
    if ( appcontent ) {
      appcontent.addEventListener( "DOMContentLoaded", function( e ) {
        e.originalTarget.addEventListener( "webdav_open", msolink.onClick, true );
      }, true );

        if ( msolink.isDebugMode() ) {
          msolink.log( "Addon loaded successfully" );
        }
    } else {
      msolink.log( "Failed to attach EventListener to 'appcontent'!" );
    }
  },

  getDocType: function( doc ) {
    var isDebug = msolink.isDebugMode();
    if ( isDebug ) {
      msolink.log( "Called 'getDocType' for document '" + doc + "'" );
    }

    var wordDocs = new Array( "doc", "docx", "dot", "dotx", "dotm", "docm" );
    var excelDocs = new Array( "xls", "xlsx", "xlt", "xltx", "xltm", "xlsb", "xlam", "xlsm" );
    var pptDocs = new Array( "ppt", "pptx", "pptm", "pot", "potx", "potm", "ppam", "ppsx", "ppsm", "sld", "sldx", "sldm", "thmx" );
    var pubDocs = new Array( "pub" );
    var projDocs = new Array( "mpd", "mpp", "mpt", "mpw", "mpx" );
    var visioDocs = new Array( "vdw", "vdx", "vsd", "vsdm", "vsdx", "vss", "vssm", "vst", "vstm", "vstx", "vsu", "vsw", "vsx", "vtx" );
    var accDocs = new Array( "accdb", "accdc", "accde", "accdr", "accdt", "accdu", "accdw", "accft", "ade", "adn", "adp", "mad", "maf", "mag", "mam", "maq", "mar", "mas", "mat", "mau", "mav", "maw", "mdb", "mde", "mdn", "mdt", "mdw" );

    var office = new Array( wordDocs, excelDocs, pptDocs, pubDocs, projDocs, visioDocs, accDocs );

    var extIndex = doc.lastIndexOf( "." );
    if ( extIndex == -1 ) {
      if ( isDebug ) {
        msolink.log( "Missing file-extension!" );
      }

      return null;
    }

    var docExt = doc.substring( extIndex + 1, doc.length );
    for( var i = 0; i < office.length; i++ ) {
      var app = office[i];
      var index = app.indexOf( docExt );
      if ( index != -1 ) {
        switch ( i ) {
          case 0:
            return msolink.WORD;
          case 1:
            return msolink.EXCEL;
          case 2:
            return msolink.POWERPOINT;
          case 3:
            return msolink.PUBLISHER;
          case 4:
            return msolink.MSPROJECT;
          case 5:
            return msolink.VISIO;
          case 6:
            return msolink.ACCESS;
        }
      }
    }

    if ( isDebug ) {
      msolink.log( "Unknown file-extension: " +  docExt );
    }

    return null;
  },

  isDebugMode: function() {
    var prefManager = Components.classes["@mozilla.org/preferences-service;1"].getService( Components.interfaces.nsIPrefBranch );
    return prefManager.getBoolPref( "extensions.msolink.debug" );
  },

  isWinOnWin: function() {
    var isDebug = msolink.isDebugMode();
    if ( isDebug ) {
      msolink.log( "Called 'isWinOnWin'." );
    }

    var registry = Components.classes["@mozilla.org/windows-registry-key;1"].createInstance( Components.interfaces.nsIWindowsRegKey );
    var winVerKey = "SOFTWARE\\Microsoft\\Windows\\CurrentVersion";
    registry.open( registry.ROOT_KEY_LOCAL_MACHINE, winVerKey, registry.ACCESS_READ );
    var isWoW = registry.hasValue( "ProgramFilesDir (x86)" );
    registry.close();

    if ( isDebug ) {
      msolink.log( "Result: " + isWoW );
    }

    return isWoW;
  },

  hasOffice: function() {
    var isDebug = msolink.isDebugMode();
    if ( isDebug ) {
      msolink.log( "Called 'hasOffice'." );
    }

    var registry = Components.classes["@mozilla.org/windows-registry-key;1"].createInstance( Components.interfaces.nsIWindowsRegKey );
    var msKey = "SOFTWARE\\Microsoft";
    registry.open( registry.ROOT_KEY_LOCAL_MACHINE, msKey, registry.ACCESS_READ );
    var hasOffice = registry.hasChild( "Office" );
    registry.close();

    if ( isDebug ) {
      msolink.log( "Result: " + hasOffice );
    }

    return hasOffice;
  },

  getLauncher: function( executable ) {
    var isDebug = msolink.isDebugMode();

    if ( isDebug ) {
      msolink.log( "Called 'getLauncher' for application '" + executable + "'" );
    }

    if ( !msolink.hasOffice() ) {
      msolink.log( "Cannot find a valid MS Office installation!" );
      return null;
    }

    // 15 (2013), 14 (2010), 12 (2007), 11 (2003)
    var officeVersions = new Array( "15.0", "14.0", "12.0", "11.0" );
    var officeNames = null;
    if ( isDebug ) {
      officeNames = new Array( "2013", "2010", "2007", "2003" );
    }

    var registry = Components.classes["@mozilla.org/windows-registry-key;1"].createInstance( Components.interfaces.nsIWindowsRegKey );

    var flags = 0;
    if ( msolink.isWinOnWin ) {
      flags = registry.ACCESS_READ | registry.WOW64_64;
      if ( isDebug ) msolink.log( "Using flag 'WOW64_64'" );
    } else {
      flags = registry.ACCESS_READ;
    }

    const REG_ACCESS_READ = flags
    registry.open( registry.ROOT_KEY_LOCAL_MACHINE, "SOFTWARE\\Microsoft\\Office", REG_ACCESS_READ );

    var path = "";
    var useWoW64Prefix = false;
    for ( var i = 0; i < 2; i++ ) {
      if ( useWoW64Prefix ) {
        if ( isDebug ) msolink.log( "Searching for 32bit Office" )

        registry.close();
        registry.open( registry.ROOT_KEY_LOCAL_MACHINE, "SOFTWARE\\Wow6432Node\\Microsoft\\Office", REG_ACCESS_READ );
      }

      for ( var j in officeVersions ) {
        if ( isDebug ) msolink.log( "Searching for Office " + officeNames[j] );

        var officeVersion = officeVersions[j];
        var installRoot = officeVersion + "\\Common\\InstallRoot";
        if ( !registry.hasChild( installRoot ) ) {
          if ( isDebug ) msolink.log( "Not found! Skipping." );
          continue;
        }

        var childNode = registry.openChild( installRoot, REG_ACCESS_READ );
        if ( childNode.hasValue( "Path" ) ) {
          path = childNode.readStringValue( "Path" );
          if ( isDebug ) {
            msolink.log( "Found at '" + path + "'" );
          }
        }

        childNode.close();
        if ( path != "" ) break;
      }

      if ( path != "" || !msolink.isWinOnWin || useWoW64Prefix ) {
        break;
      }

      useWoW64Prefix = true;
    }

    registry.close();

    if ( path == "" ) {
      if ( isDebug ) {
        msolink.log( "No suitable Office version found!" );
      }

      return null;
    }

    var retVal = path + ( path[path.length -1] == "\\" ? "" : "\\" ) + executable;
    if ( isDebug ) {
      msolink.log( "Using application '" + retVal + "'" );
    }

    return retVal;
  },

  onClick: function( e ) {
    var target = e.originalTarget;
    var isDebug = msolink.isDebugMode();
    if ( isDebug ) {
      msolink.log( "Received 'webdav_open' request for URL '" + target + "'" );
    }

    var docType = msolink.getDocType( target.href );

    if ( !docType ) {
      return false;
    }

    var path = msolink.getLauncher( docType.name );
    if ( !path ) {
      return false;
    }

    try {
      if ( isDebug ) {
        msolink.log( "Preparing application launch" );
      }

      var launcher = Components.classes['@mozilla.org/file/local;1'].createInstance( Components.interfaces.nsILocalFile );
      launcher.initWithPath( path );
      if ( !launcher.exists() ) {
        msolink.log( "Cannot start '" + path + "'. File not found!" );
        return true;
      }

      var process = Components.classes['@mozilla.org/process/util;1'].createInstance( Components.interfaces.nsIProcess );
      process.init( launcher );

      var args = new Array( target.href );

      if ( isDebug ) {
        msolink.log( "Launching Office" );
      }

      process.run( false, args, args.length );

      if ( isDebug ) {
        msolink.log( "Done" );
      }
    } catch ( ex ) {
      msolink.log( ex );
    }

    return false;
  },

  log: function( msg ) {
    Components.utils.reportError( "MSOLink: " + msg );
    },
};

window.addEventListener( "load", msolink.init, false );
