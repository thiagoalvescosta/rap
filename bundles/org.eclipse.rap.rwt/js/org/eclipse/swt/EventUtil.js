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

/**
 * This class contains static listener functions for common events.
 */
qx.Class.define( "org.eclipse.swt.EventUtil", {

  statics : {
    _suspended : false,

    setSuspended : function( value ) {
      this._suspended = value;
    },

    getSuspended : function() {
      return this._suspended;
    },

    DOUBLE_CLICK_TIME : 500,

    _capturingWidget : null,
    _lastMouseDown : {
      widget : null,
      button : "",
      x : -1,
      y : -1,
      mouseUpCount : 0
    },
    _shiftKey : false,
    _ctrlKey : false,
    _altKey : false,
    _metaKey : false,

    eventTimestamp : function() {
      var init = rwt.runtime.System.getInstance();
      return new Date().getTime() - init.getStartupTime();
    },

    widgetDefaultSelected : function( evt, target ) {
      if( !org.eclipse.swt.EventUtil.getSuspended() ) {
        var server = rwt.remote.Server.getInstance();
        var properties = {};
        org.eclipse.swt.EventUtil.addModifierToProperties( properties );
        var serverObject = server.getServerObject( target ? target : evt.getTarget() );
        serverObject.notify( "DefaultSelected", properties );
      }
    },

    widgetSelected : function( evt ) {
      var left = evt.getTarget().getLeft();
      var top = evt.getTarget().getTop();
      var width = evt.getTarget().getWidth();
      var height = evt.getTarget().getHeight();
      org.eclipse.swt.EventUtil.notifySelected( evt.getTarget(), left, top, width, height );
    },

    notifySelected : function( target, left, top, width, height, detail) {
      if( !org.eclipse.swt.EventUtil.getSuspended() ) {
        var server = rwt.remote.Server.getInstance();
        var properties = {
          "x" : left,
          "y" : top,
          "width" : width,
          "height" : height,
          "detail" : detail
        };
        org.eclipse.swt.EventUtil.addModifierToProperties( properties );
        server.getServerObject( target ).notify( "Selected", properties );
      }
    },

    notifyDefaultSelected : function( target, left, top, width, height, detail) {
      if( !org.eclipse.swt.EventUtil.getSuspended() ) {
        var server = rwt.remote.Server.getInstance();
        var properties = {
            "x" : left,
            "y" : top,
            "width" : width,
            "height" : height,
            "detail" : detail
        };
        org.eclipse.swt.EventUtil.addModifierToProperties( properties );
        server.getServerObject( target ).notify( "DefaultSelected", properties );
      }
    },

    addWidgetSelectedModifier : function() {
      if( !org.eclipse.swt.EventUtil.getSuspended() ) {
        var commandKey
        = rwt.client.Client.getPlatform() === "mac" && org.eclipse.swt.EventUtil._metaKey;
        var shiftKey = org.eclipse.swt.EventUtil._shiftKey;
        var ctrlKey = org.eclipse.swt.EventUtil._ctrlKey || commandKey;
        var altKey = org.eclipse.swt.EventUtil._altKey;
        var req = rwt.remote.Server.getInstance();
        req.addParameter( "org.eclipse.swt.events.Selected.shiftKey", shiftKey );
        req.addParameter( "org.eclipse.swt.events.Selected.ctrlKey", ctrlKey );
        req.addParameter( "org.eclipse.swt.events.Selected.altKey", altKey );
      }
    },

    addModifierToProperties : function( properties ) {
      var commandKey
        = rwt.client.Client.getPlatform() === "mac" && org.eclipse.swt.EventUtil._metaKey;
      properties.shiftKey = org.eclipse.swt.EventUtil._shiftKey;
      properties.ctrlKey = org.eclipse.swt.EventUtil._ctrlKey || commandKey;
      properties.altKey = org.eclipse.swt.EventUtil._altKey;
    },

    _getKeyModifier : function() {
      var modifier = ""; // TODO [tb] : use real array for json protocol
      var commandKey
        = rwt.client.Client.getPlatform() === "mac" && org.eclipse.swt.EventUtil._metaKey;
      if( org.eclipse.swt.EventUtil._shiftKey ) {
        modifier += "shift,";
      }
      if( org.eclipse.swt.EventUtil._ctrlKey || commandKey ) {
        modifier += "ctrl,";
      }
      if( org.eclipse.swt.EventUtil._altKey ) {
        modifier += "alt,";
      }
      return modifier;
    },

    focusGained : function( evt ) {
      if( !org.eclipse.swt.EventUtil.getSuspended() ) {
        // [if] The focusControl parameter is added in the request in Shell.js
        var req = rwt.remote.Server.getInstance();
        req.send();
      }
    },

    focusLost : function( evt ) {
      if( !org.eclipse.swt.EventUtil.getSuspended() ) {
        // [if] The focusControl parameter is added in the request in Shell.js
        var req = rwt.remote.Server.getInstance();
        req.send();
      }
    },

    ///////////////////////
    // Mouse event handling

    mouseDown : function( evt ) {
      if(    !org.eclipse.swt.EventUtil.getSuspended()
          && org.eclipse.swt.EventUtil._isRelevantMouseEvent( this, evt ) )
      {
        // disabled capturing as it interferes with Combo capturing
        // see https://bugs.eclipse.org/bugs/show_bug.cgi?id=262171
        //// from now on, redirect mouse event to this widget
        //this.setCapture( true );
        org.eclipse.swt.EventUtil._capturingWidget = this;
        // Add parameters for double-click event
        if( org.eclipse.swt.EventUtil._isDoubleClick( this, evt ) ) {
          org.eclipse.swt.EventUtil._clearLastMouseDown();
          org.eclipse.swt.EventUtil._mouseDoubleClickParams( this, evt );
        } else {
          // Store relevant data of current event to detect double-clicks
          var lastMouseDown = org.eclipse.swt.EventUtil._lastMouseDown;
          lastMouseDown.widget = this;
          lastMouseDown.button = evt.getButton();
          lastMouseDown.x = evt.getPageX();
          lastMouseDown.y = evt.getPageY();
          lastMouseDown.mouseUpCount = 0;
          rwt.client.Timer.once( org.eclipse.swt.EventUtil._clearLastMouseDown,
                                this,
                                org.eclipse.swt.EventUtil.DOUBLE_CLICK_TIME );
        }
        // Collect request parameters and send
        org.eclipse.swt.EventUtil._mouseDownParams( this, evt );
        var req = rwt.remote.Server.getInstance();
        req.send();
      }
    },

    mouseUp : function( evt ) {
      if(    !org.eclipse.swt.EventUtil.getSuspended()
          && org.eclipse.swt.EventUtil._isRelevantMouseEvent( this, evt ) )
      {
        // disabled capturing as it interferes with Combo capturing
        // see https://bugs.eclipse.org/bugs/show_bug.cgi?id=262171
        //// release mouse event capturing
        //this.setCapture( false );
        org.eclipse.swt.EventUtil._capturingWidget = null;
        // increase number of mouse-up events since last stored mouse down
        org.eclipse.swt.EventUtil._lastMouseDown.mouseUpCount += 1;
        // Add mouse-up request parameter
        org.eclipse.swt.EventUtil._mouseUpParams( this, evt );
        var req = rwt.remote.Server.getInstance();
        req.send();
      }
    },

    /**
     * Determines whether the event is relevant (i.e. should be sent) for the
     * given widget.
     * @param widget - the listening widget
     * @param evt - the mouse event
     */
    _isRelevantMouseEvent : function( widget, evt ) {
      var result = true;
      if(    widget !== org.eclipse.swt.EventUtil._capturingWidget
          && widget !== evt.getOriginalTarget() )
      {
        // find parent control and ensure that it is the same as the widget-
        // parameter. Otherwise the mouse event is ignored.
        var widgetManager = org.eclipse.swt.WidgetManager.getInstance();
        var target = evt.getOriginalTarget();
        var control = widgetManager.findControl( target );
        result = widget === control;
      }
      return result;
    },

    _clearLastMouseDown : function() {
      var lastMouseDown = org.eclipse.swt.EventUtil._lastMouseDown;
      lastMouseDown.widget = null;
      lastMouseDown.button = "";
      lastMouseDown.mouseUpCount = 0;
      lastMouseDown.x = -1;
      lastMouseDown.y = -1;
    },

    _isDoubleClick : function( widget, evt ) {
      // TODO [rh] compare last position with current position and don't
      //      report double-click if deviation is too big
      var lastMouseDown = org.eclipse.swt.EventUtil._lastMouseDown;
      return    lastMouseDown.mouseUpCount === 1
             && lastMouseDown.widget === widget
             && lastMouseDown.button === qx.event.type.MouseEvent.C_BUTTON_LEFT
             && lastMouseDown.button === evt.getButton();
    },

    _mouseDownParams : function( widget, evt ) {
      var id = org.eclipse.swt.WidgetManager.getInstance().findIdByWidget( widget );
      var req = rwt.remote.Server.getInstance();
      var button = org.eclipse.swt.EventUtil._determineMouseButton( evt );
      var modifier = org.eclipse.swt.EventUtil._getKeyModifier();
      req.addEvent( "org.eclipse.swt.events.mouseDown", id );
      req.addParameter( "org.eclipse.swt.events.mouseDown.button", button );
      req.addParameter( "org.eclipse.swt.events.mouseDown.x", evt.getPageX() );
      req.addParameter( "org.eclipse.swt.events.mouseDown.y", evt.getPageY() );
      req.addParameter( "org.eclipse.swt.events.mouseDown.time", this.eventTimestamp() );
      if( modifier !== "" ) {
        req.addParameter( "org.eclipse.swt.events.mouseDown.modifier", modifier );
      }
    },

    _mouseUpParams : function( widget, evt ) {
      var id = org.eclipse.swt.WidgetManager.getInstance().findIdByWidget( widget );
      var req = rwt.remote.Server.getInstance();
      var button = org.eclipse.swt.EventUtil._determineMouseButton( evt );
      var modifier = org.eclipse.swt.EventUtil._getKeyModifier();
      req.addEvent( "org.eclipse.swt.events.mouseUp", id );
      req.addParameter( "org.eclipse.swt.events.mouseUp.button", button );
      req.addParameter( "org.eclipse.swt.events.mouseUp.x", evt.getPageX() );
      req.addParameter( "org.eclipse.swt.events.mouseUp.y", evt.getPageY() );
      req.addParameter( "org.eclipse.swt.events.mouseUp.time", this.eventTimestamp() );
      if( modifier !== "" ) {
        req.addParameter( "org.eclipse.swt.events.mouseUp.modifier", modifier );
      }
    },

    _mouseDoubleClickParams : function( widget, evt ) {
      var id = org.eclipse.swt.WidgetManager.getInstance().findIdByWidget( widget );
      var req = rwt.remote.Server.getInstance();
      var modifier = org.eclipse.swt.EventUtil._getKeyModifier();
      req.addEvent( "org.eclipse.swt.events.mouseDoubleClick", id );
      req.addParameter( "org.eclipse.swt.events.mouseDoubleClick.button",
                        org.eclipse.swt.EventUtil._determineMouseButton( evt ) );
      req.addParameter( "org.eclipse.swt.events.mouseDoubleClick.x",
                        evt.getPageX() );
      req.addParameter( "org.eclipse.swt.events.mouseDoubleClick.y",
                        evt.getPageY() );
      req.addParameter( "org.eclipse.swt.events.mouseDoubleClick.time",
                        this.eventTimestamp() );
      if( modifier !== "" ) {
        req.addParameter( "org.eclipse.swt.events.mouseDoubleClick.modifier",
                          modifier );
      }
    },

    /**
     * Returns an integer value that represents the button property from the
     * given mouse event.
     * 0 = unknown
     * 1 = left button
     * 2 = middle button
     * 3 = right button
     */
    _determineMouseButton : function( evt ) {
      var result = 0;
      switch( evt.getButton() ) {
        case qx.event.type.MouseEvent.C_BUTTON_LEFT:
          result = 1;
          break;
        case qx.event.type.MouseEvent.C_BUTTON_MIDDLE:
          result = 2;
          break;
        case qx.event.type.MouseEvent.C_BUTTON_RIGHT:
          result = 3;
          break;
      }
      return result;
    },

    helpRequested : function( evt ) {
      if( evt.getKeyIdentifier() === "F1" ) {
        // stop further handling and default handling by the browser
        evt.stopPropagation();
        evt.preventDefault();
        // send help request to server
        var widget = evt.getTarget();
        var widgetManager = org.eclipse.swt.WidgetManager.getInstance();
        var id = widgetManager.findIdByWidget( widget );
        if( id === null ) {
          // find parent control for the widget that received the event in case
          // it wasn't the control itself that received the event
          widget = widgetManager.findControl( widget );
          id = widgetManager.findIdByWidget( widget );
        }
        if( id != null ) {
          var req = rwt.remote.Server.getInstance();
          req.addEvent( "org.eclipse.swt.events.help", id );
          req.send();
        }
      }
    },

    menuDetectedByKey : function( evt ) {
      if( evt.getKeyIdentifier() === "Apps" ) {
        // stop further handling and default handling by the browser
        evt.stopPropagation();
        evt.preventDefault();
        var x = qx.event.type.MouseEvent.getPageX();
        var y = qx.event.type.MouseEvent.getPageY();
        org.eclipse.swt.EventUtil.sendMenuDetected( evt.getTarget(), x, y );
      }
    },

    menuDetectedByMouse : function( evt ) {
      if( evt.getButton() === qx.event.type.MouseEvent.C_BUTTON_RIGHT ) {
        // stop further handling and default handling by the browser
        evt.stopPropagation();
        evt.preventDefault();
        var x = evt.getPageX();
        var y = evt.getPageY();
        org.eclipse.swt.EventUtil.sendMenuDetected( evt.getTarget(), x, y );
      }
    },

    sendMenuDetected : function( widget, x, y ) {
      if( !org.eclipse.swt.EventUtil.getSuspended() ) {
        // send menu detect request to server
        var widgetManager = org.eclipse.swt.WidgetManager.getInstance();
        // find parent control for the widget that received the event in case
        // it wasn't the control itself that received the event
        while( widget != null && !widgetManager.isControl( widget ) ) {
          widget = widget.getParent ? widget.getParent() : null;
        }
        var id = widgetManager.findIdByWidget( widget );
        if( id != null ) {
          var req = rwt.remote.Server.getInstance();
          req.addEvent( "org.eclipse.swt.events.menuDetect", id );
          req.addParameter( "org.eclipse.swt.events.menuDetect.x", x );
          req.addParameter( "org.eclipse.swt.events.menuDetect.y", y );
          req.send();
        }
      }
    }

  }
} );
