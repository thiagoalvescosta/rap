/*******************************************************************************
 * Copyright (c) 2002, 2012 Innoopract Informationssysteme GmbH and others.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors:
 *    Innoopract Informationssysteme GmbH - initial API and implementation
 *    EclipseSource - ongoing development
 ******************************************************************************/

/*global confirm: false*/

qx.Class.define( "org.eclipse.swt.Server", {
  type : "singleton",
  extend : qx.core.Target,

  construct : function() {
    this.base( arguments );
    // the URL to which the requests are sent
    this._url = "";
    // the map of parameters that will be posted with the next call to 'send()'
    this._parameters = {};
    // instance variables that hold the essential request parameters
    this._uiRootId = "";
    this._requestCounter = null;
    // Number of currently running or scheduled requests, used to determine when
    // to show the wait hint (e.g. hour-glass cursor)
    this._runningRequestCount = 0;
    // Flag that is set to true if send() was called but the delay timeout
    // has not yet timed out
    this._inDelayedSend = false;
    this._retryHandler = null;
    // References the currently running request or null if no request is active
    this._currentRequest = null;
  },

  destruct : function() {
    this._currentRequest = null;
  },

  events : {
    "send" : "qx.event.type.DataEvent",
    "received" : "qx.event.type.DataEvent"
  },

  members : {

    setUrl : function( url ) {
      this._url = url;
    },

    getUrl : function() {
      return this._url;
    },

    setUIRootId : function( uiRootId ) {
      this._uiRootId = uiRootId;
    },

    getUIRootId : function() {
      return this._uiRootId;
    },

    setRequestCounter : function( requestCounter ) {
      this._requestCounter = requestCounter;
    },

    getRequestCounter : function() {
      return this._requestCounter;
    },

    /**
     * Adds a request parameter to this request with the given name and value
     */
    addParameter : function( name, value ) {
      this._parameters[ name ] = value;
    },

    /**
     * Removes the parameter denoted by name from this request.
     */
    removeParameter : function( name ) {
      delete this._parameters[ name ];
    },

    /**
     * Returns the parameter value for the given name or null if no parameter
     * with such a name exists.
     */
    getParameter : function( name ) {
      var result = this._parameters[ name ];
      if( result === undefined ) {
        result = null;
      }
      return result;
    },

    /**
     * Adds the given eventType to this request. The sourceId denotes the id of
     * the widget that caused the event.
     */
    addEvent : function( eventType, sourceId ) {
      this._parameters[ eventType ] = sourceId;
    },

    /**
     * Sends this request asynchronously. All parameters that were added since
     * the last 'send()' will now be sent.
     */
    send : function() {
      if( !this._inDelayedSend ) {
        this._inDelayedSend = true;
        var func = function() {
          this._sendImmediate( true );
        };
        qx.client.Timer.once( func, this, 60 );
      }
    },

    sendSyncronous : function() {
      this._sendImmediate( false );
    },

    _sendImmediate : function( async ) {
      this._dispatchSendEvent();
      // set mandatory parameters; do this after regular params to override them
      // in case of conflict
      this._parameters[ "uiRoot" ] = this._uiRootId;
      if( this._requestCounter == -1 ) {
        // NOTE: Delay sending the request until requestCounter is set
        this._inDelayedSend = false;
        this.send();
      } else {
        if( this._requestCounter != null ) {
          this._parameters[ "requestCounter" ] = this._requestCounter;
          this._requestCounter = -1;
        }
        // create and configure request object
        var request = this._createRequest();
        request.setAsynchronous( async );
        // copy the _parameters map which was filled during client interaction
        // to the request
        this._inDelayedSend = false;
        this._copyParameters( request );
        this._runningRequestCount++;
        // notify user when request takes longer than 500 ms
        if( this._runningRequestCount === 1 ) {
          qx.client.Timer.once( this._showWaitHint, this, 500 );
        }
        // clear the parameter list
        this._parameters = {};
        request.send();
        this._currentRequest = request;
      }
    },

    _copyParameters : function( request ) {
      var data = [];
      for( var parameterName in this._parameters ) {
        data.push(   encodeURIComponent( parameterName )
                   + "="
                   + encodeURIComponent( this._parameters[ parameterName ] ) );
      }
      request.setData( data.join( "&" ) );
    },

    _createRequest : function() {
      var result = new org.eclipse.rwt.Request( this._url, "POST", "application/javascript" );
      result.setSuccessHandler( this._handleSuccess, this );
      result.setErrorHandler( this._handleError, this );
      return result;
    },

    ////////////////////////
    // Handle request events

    _handleSending : function( evt ) {
      var exchange = evt.getTarget();
      this._currentRequest = exchange.getRequest();
    },

    _handleFailed : function( evt ) {
      var exchange = evt.getTarget();
      this._currentRequest = exchange.getRequest();
    },

    _handleError : function( event ) {
      if( this._isConnectionError( statusCode ) ) {
        this._handleConnectionError( event );
      } else {
        var text = event.resonseText;
        this._hideWaitHint();
        // [if] typeof(..) == "unknown" is IE specific. Used to prevent error:
        // "The data  necessary to complete this operation is not yet available"
        if( typeof( text ) == "unknown" ) {
          text = undefined;
        }
        if( text && text.length > 0 ) {
          if( this._isJsonResponse( event.responseHeaders ) ) {
            var messageObject = JSON.parse( text );
            org.eclipse.rwt.ErrorHandler.showErrorBox( messageObject.meta.message, true );
          } else {
            org.eclipse.rwt.ErrorHandler.showErrorPage( text );
          }
        } else {
          var statusCode = String( statusCode );
          text = "<p>Request failed.</p><pre>HTTP Status Code: " + statusCode + "</pre>";
          org.eclipse.rwt.ErrorHandler.showErrorPage( text );
        }
      }
    },

    _handleSuccess : function( event ) {
      var errorOccured = false;
      try {
        var messageObject = JSON.parse( event.responseText );
        org.eclipse.swt.EventUtil.setSuspended( true );
        org.eclipse.rwt.protocol.Processor.processMessage( messageObject );
        qx.ui.core.Widget.flushGlobalQueues();
        org.eclipse.swt.EventUtil.setSuspended( false );
        org.eclipse.rwt.UICallBack.getInstance().sendUICallBackRequest();
      } catch( ex ) {
        org.eclipse.rwt.ErrorHandler.processJavaScriptErrorInResponse( event.responseText,
                                                                       ex,
                                                                       event.target );
        errorOccured = true;
      }
      if( !errorOccured ) {
        this._dispatchReceivedEvent();
      }
      this._runningRequestCount--;
      this._hideWaitHint();
    },

    _handleCompleted : function( evt ) {
      // [if] Dispose only finished transport - see bug 301261, 317616
      var exchange = evt.getTarget();
      exchange.dispose();
    },

    ///////////////////////////////
    // Handling connection problems

    _handleConnectionError : function( event ) {
      var msg
        = "<p>The server seems to be temporarily unavailable</p>"
        + "<p><a href=\"javascript:org.eclipse.swt.Server.getInstance()._retry();\">Retry</a></p>";
      qx.ui.core.ClientDocument.getInstance().setGlobalCursor( null );
      org.eclipse.rwt.ErrorHandler.showErrorBox( msg, false );
      this._retryHandler = function() {
        var request = this._createRequest();
        var failedRequest = event.target;
        request.setAsynchronous( failedRequest.getAsynchronous() );
        request.setData( failedRequest.getData() );
        request.send();
        this._currentRequest = request;
      };
    },

    _retry : function() {
      try {
        org.eclipse.rwt.ErrorHandler.hideErrorBox();
        this._showWaitHint();
        this._retryHandler();
      } catch( ex ) {
        org.eclipse.rwt.ErrorHandler.processJavaScriptError( ex );
      }
    },

    _isConnectionError : qx.core.Variant.select( "qx.client", {
      "mshtml|newmshtml" : function( statusCode ) {
        // for a description of the IE status codes, see
        // http://support.microsoft.com/kb/193625
        var result = (    statusCode === 12007    // ERROR_INTERNET_NAME_NOT_RESOLVED
                       || statusCode === 12029    // ERROR_INTERNET_CANNOT_CONNECT
                       || statusCode === 12030    // ERROR_INTERNET_CONNECTION_ABORTED
                       || statusCode === 12031    // ERROR_INTERNET_CONNECTION_RESET
                       || statusCode === 12152 ); // ERROR_HTTP_INVALID_SERVER_RESPONSE
        return result;
      },
      "gecko" : function( statusCode ) {
        // Firefox 3 reports other statusCode than oder versions (bug #249814)
        var result;
        // Check if Gecko > 1.9 is running (used in FF 3)
        // Gecko/app integration overview: http://developer.mozilla.org/en/Gecko
        if( org.eclipse.rwt.Client.getMajor() * 10 + org.eclipse.rwt.Client.getMinor() >= 19 ) {
          result = ( statusCode === 0 );
        } else {
          result = ( statusCode === -1 );
        }
        return result;
      },
      "default" : function( statusCode ) {
        return statusCode === 0;
      }
    } ),

    _isJsonResponse : function( headers ) {
      var contentType = headers[ "Content-Type" ];
      return contentType.indexOf( qx.util.Mime.JSON ) !== -1;
    },

    ///////////////////////////////////////////////////
    // Wait hint - UI feedback while request is running

    _showWaitHint : function() {
      if( this._runningRequestCount > 0 ) {
        var doc = qx.ui.core.ClientDocument.getInstance();
        doc.setGlobalCursor( qx.constant.Style.CURSOR_PROGRESS );
      }
    },

    _hideWaitHint : function() {
      if( this._runningRequestCount === 0 ) {
        var doc = qx.ui.core.ClientDocument.getInstance();
        doc.setGlobalCursor( null );
      }
    },

    _dispatchSendEvent : function() {
      if( this.hasEventListeners( "send" ) ) {
        var event = new qx.event.type.DataEvent( "send", this );
        this.dispatchEvent( event, true );
      }
    },

    _dispatchReceivedEvent : function() {
      if( this.hasEventListeners( "received" ) ) {
        var event = new qx.event.type.DataEvent( "received", this );
        this.dispatchEvent( event, true );
      }
    }
  }
});