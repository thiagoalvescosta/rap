/*******************************************************************************
 * Copyright (c) 2011, 2013 EclipseSource and others.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors:
 *    EclipseSource - initial API and implementation
 ******************************************************************************/

/*global console: false */

rwt.qx.Class.define( "rwt.runtime.ErrorHandler", {

  statics : {

    _overlay : null,
    _box : null,

    processJavaScriptErrorInResponse : function( script, error, currentRequest ) {
      var content = "<p>Could not process server response:</p><pre>";
      content += this._gatherErrorInfo( error, script, currentRequest );
      content += "</pre>";
      this.showErrorPage( content );
    },

    processJavaScriptError : function( error ) {
      this.errorObject = error; // for later inspection by developer
      if( typeof console === "object" ) {
        var msg = "Error: " + ( error.message ? error.message : error );
        if( typeof console.error !== "undefined" ) { // IE returns "object" for typeof
          console.error( msg );
        } else if( typeof console.log !== "undefined" ) {
          console.log( msg );
        }
        if( typeof console.log === "function" && error.stack ) {
          console.log( "Error stack:\n" + error.stack );
        } else if( typeof console.trace !== "undefined" ) {
          console.trace();
        }
      }
      var debug = true;
      try {
        debug = rwt.util.Variant.isSet( "qx.debug", "on" );
      } catch( ex ) {
        // ignore: Variant may not be loaded yet
      }
      if( debug ) {
        var content = "<p>Javascript error occurred:</p><pre>";
        content += this._gatherErrorInfo( error );
        content += "</pre>";
        this.showErrorPage( content );
        throw error;
      }
    },

    showErrorPage : function( content ) {
      this._enableTextSelection();
      this._freezeApplication();
      document.title = "Error Page";
      this._createErrorPageArea().innerHTML = content;
    },

    showErrorBox : function( errorType, freeze ) {
      if( freeze ) {
        this._freezeApplication();
      }
      this._overlay = this._createOverlay();
      this._box = this._createErrorBoxArea( 450, 150 );
      this._box.style.padding = "0px";
      this._box.style.border = "1px solid #3B5998";
      this._box.style.overflow = "hidden";
      this._title = this._createErrorBoxTitleArea( this._box );
      this._title.innerHTML = this._getErrorMessage( errorType )[ 0 ];
      this._description = this._createErrorBoxDescriptionArea( this._box );
      this._description.innerHTML = this._getErrorMessage( errorType )[ 1 ];
      this._action = this._createErrorBoxActionArea( this._box );
      this._action.innerHTML = this._getErrorMessage( errorType )[ 2 ];
      var hyperlink = this._box.getElementsByTagName( "a" )[ 0 ];
      if( hyperlink ) {
        hyperlink.style.outline = "none";
        hyperlink.focus();
      }
    },

    showWaitHint : function() {
      this._overlay = this._createOverlay();
      var themeStore = rwt.theme.ThemeStore.getInstance();
      var cssElement = "SystemMessage-DisplayOverlay";
      var icon = themeStore.getSizedImage( cssElement, {}, "background-image" );
      if( icon && icon[ 0 ] ) {
        this._box = this._createErrorBoxArea( icon[ 1 ], icon[ 2 ] );
        rwt.html.Style.setBackgroundImage( this._box, icon[ 0 ] );
        this._box.style.backgroundColor = "transparent";
        this._box.style.border = "none";
        this._box.style.overflow = "hidden";
      }
    },

    hideErrorBox : function() {
      if( this._box ) {
        this._box.parentNode.removeChild( this._box );
        this._box = null;
      }
      if( this._overlay ) {
        this._overlay.parentNode.removeChild( this._overlay );
        this._overlay = null;
      }
      rwt.event.EventHandler.setBlockKeyEvents( false );
    },

    _gatherErrorInfo : function( error, script, currentRequest ) {
      var info = [];
      try {
        info.push( "Error: " + error + "\n" );
        if( script ) {
          info.push( "Script: " + script );
        }
        if( error instanceof Error ) {
          for( var key in error ) { // NOTE : does not work in webkit (no iteration)
            info.push( key + ": " + error[ key ] );
          }
          if( error.stack ) { // ensures stack is printed in webkit, might be printed twice in gecko
            info.push( "Stack: " + error.stack );
          }
       }
        info.push( "Debug: " + rwt.util.Variant.get( "qx.debug" ) );
        if( currentRequest ) {
          info.push( "Request: " + currentRequest.getData() );
        }
        var inFlush = rwt.widgets.base.Widget._inFlushGlobalQueues;
        if( inFlush ) {
          info.push( "Phase: " + rwt.widgets.base.Widget._flushGlobalQueuesPhase );
        }
      } catch( ex ) {
        // ensure we get a info no matter what
      }
      return info.join( "\n  " );
    },

    _createOverlay : function() {
      var element = document.createElement( "div" );
      var themeStore = rwt.theme.ThemeStore.getInstance();
      var color = themeStore.getColor( "SystemMessage-DisplayOverlay", {}, "background-color" );
      var alpha = themeStore.getAlpha( "SystemMessage-DisplayOverlay", {}, "background-color" );
      var style = element.style;
      style.position = "absolute";
      style.width = "100%";
      style.height = "100%";
      style.backgroundColor = color === "undefined" ? "transparent" : color;
      rwt.html.Style.setOpacity( element, alpha );
      style.zIndex = 100000000;
      document.body.appendChild( element );
      rwt.event.EventHandler.setBlockKeyEvents( true );
      return element;
    },

    _createErrorPageArea : function() {
      var element = document.createElement( "div" );
      var style = element.style;
      style.position = "absolute";
      style.width = "100%";
      style.height = "100%";
      style.backgroundColor = "#ffffff";
      style.zIndex = 100000001;
      style.overflow = "auto";
      style.padding = "10px";
      document.body.appendChild( element );
      return element;
    },

    _createErrorBoxArea : function( width, height ) {
      var element = document.createElement( "div" );
      var style = element.style;
      style.position = "absolute";
      style.width = width + "px";
      style.height = height + "px";
      var doc = rwt.widgets.base.ClientDocument.getInstance();
      var left = ( doc.getClientWidth() - width ) / 2;
      var top = ( doc.getClientHeight() - height ) / 2;
      style.left = ( left < 0 ? 0 : left ) + "px";
      style.top = ( top < 0 ? 0 : top ) + "px";
      style.zIndex = 100000001;
      style.padding = "10px";
      style.textAlign = "center";
      style.fontFamily = 'verdana,"lucida sans",arial,helvetica,sans-serif';
      style.fontSize = "12px";
      style.fontStyle = "normal";
      style.fontWeight = "normal";
      document.body.appendChild( element );
      return element;
    },

    _createErrorBoxTitleArea : function( parentElement ) {
      var element = document.createElement( "div" );
      var style = element.style;
      style.position = "absolute";
      style.width = "100%";
      style.height = "40px";
      style.padding = "10px";
      style.textAlign = "left";
      style.backgroundColor = "#406796";
      style.color = "white";
      style.fontSize = "14px";
      style.fontWeight = "bold";
      parentElement.appendChild( element );
      return element;
    },

    _createErrorBoxDescriptionArea : function( parentElement ) {
      var element = document.createElement( "div" );
      var style = element.style;
      style.position = "absolute";
      style.width = "100%";
      style.height = "70px";
      style.top = "40px";
      style.padding = "10px";
      style.overflow = "auto";
      style.textAlign = "left";
      style.backgroundColor = "white";
      style.fontSize = "14px";
      parentElement.appendChild( element );
      return element;
    },

    _createErrorBoxActionArea : function( parentElement ) {
      var element = document.createElement( "div" );
      var style = element.style;
      style.position = "absolute";
      style.width = "100%";
      style.height = "40px";
      style.top = "110px";
      style.padding = "10px";
      style.textAlign = "center";
      style.backgroundColor = "#F2F2F2";
      style.fontSize = "14px";
      parentElement.appendChild( element );
      return element;
    },

    _freezeApplication : function() {
      try {
        var display = rwt.widgets.Display.getCurrent();
        display.setExitConfirmation( null );
        //qx.io.remote.RequestQueue.getInstance().setEnabled( false );
        rwt.event.EventHandler.detachEvents();
        rwt.qx.Target.prototype.dispatchEvent = function() {};
        rwt.animation.Animation._stopLoop();
      } catch( ex ) {
        try {
          console.log( "_freezeApplication exception: " + ex );
        } catch( exTwo ) {
          // ignore
        }
      }
    },

    _enableTextSelection : function() {
      var doc = rwt.widgets.base.ClientDocument.getInstance();
      doc.setSelectable( true );
      if( rwt.client.Client.isGecko() ) {
        var EventHandlerUtil = rwt.event.EventHandlerUtil;
        rwt.html.EventRegistration.removeEventListener( document.documentElement,
                                                        "mousedown",
                                                        EventHandlerUtil._ffMouseFixListener );
      }
    },

    _getErrorMessage : function( errorType ) {
      var result = [ "", "", "" ];
      var encodingUtil = rwt.util.Encoding;
      var messages = rwt.client.ClientMessages.getInstance();
      switch( errorType ) {
        case "invalid request counter":
        case "request failed":
          result[ 0 ] = messages.getMessage( "ServerError" );
          result[ 1 ] = messages.getMessage( "ServerErrorDescription" );
          result[ 2 ] = "<a {HREF_URL}>" + messages.getMessage( "Restart" ) + "</a>";
          break;
        case "session timeout":
          result[ 0 ] = messages.getMessage( "SessionTimeout" );
          result[ 1 ] = messages.getMessage( "SessionTimeoutDescription" );
          result[ 2 ] = "<a href=\"" + this._getRestartURL()+ "\">" 
                      + messages.getMessage( "Restart" ) + "</a>";
          break;
        case "connection error":
          result[ 0 ] = messages.getMessage( "ConnectionError" );
          result[ 1 ] = messages.getMessage( "ConnectionErrorDescription" );
          result[ 2 ] = "<a href=\"javascript:rwt.remote.Server.getInstance()._retry();\">" 
                      + messages.getMessage( "Retry" ) + "</a>";
          break;
        default:
          result[ 0 ] = messages.getMessage( "ServerError" );
      }
      result[ 0 ] = encodingUtil.replaceNewLines( result[ 0 ], "" );
      result[ 1 ] = encodingUtil.escapeText( result[ 1 ] );
      result[ 1 ] = encodingUtil.replaceNewLines( result[ 1 ], "<br/>" );
      return result;
    },

    _getRestartURL : function() {
      var result = String( window.location );
      var index = result.indexOf( "#" );
      if( index != -1 ) {
        result = result.substring( 0, index );
      }
      return result;
    }

  }

} );
