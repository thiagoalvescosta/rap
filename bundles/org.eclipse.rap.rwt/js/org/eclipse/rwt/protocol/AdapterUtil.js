/*******************************************************************************
 * Copyright (c) 2011 EclipseSource and others.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors:
 *    EclipseSource - initial API and implementation
 ******************************************************************************/

namespace( "org.eclipse.rwt.protocol" );

org.eclipse.rwt.protocol.AdapterUtil = {
  
  _controlDestructor : function( widget ) {
    var shell = org.eclipse.rwt.protocol.AdapterUtil.getShell( widget );
    if( shell ) {
      // remove from shells list of widgets listening for activate events (if present)
      shell.removeActivateListenerWidget( widget );          
    }
    widget.setToolTip( null );
    widget.setUserData( "toolTipText", null );
    widget.destroy();
  },
  
  _controlProperties : [
    "zIndex",
    "tabIndex",
    "toolTip",
    "visibility",
    "enabled",
    "foreground",
    "background",
    "backgroundImage",
    "cursor",
    "customVariant",
    "bounds",
    "font",
    "menu"
  ],
  
  _controlPropertyHandler : {
    "foreground" : function( widget, value ) {
      if( value === null ) {
        widget.resetTextColor();
      } else {
        widget.setTextColor( qx.util.ColorUtil.rgbToRgbString( value ) );
      }
    },
    "background" : function( widget, value ) {
      if( value === null ) {
        widget.resetBackgroundColor();
        widget.resetBackgroundGradient();
      } else {
        widget.setBackgroundGradient( null );
        var color = value[ 3 ] === 0 ? "transparent" : qx.util.ColorUtil.rgbToRgbString( value );
        widget.setBackgroundColor( color );
      }
    },
    "backgroundImage" : function( widget, value ) {
      if( value === null ) {
        widget.resetBackgroundImage();
        widget.setUserData( "backgroundImageSize", null );
      } else {
        widget.setBackgroundImage( value[ 0 ] );
        widget.setUserData( "backgroundImageSize", value.slice( 1 ) );
      }
    },
    "cursor" : function( widget, value ) {
      if( value === null ) {
        widget.resetCursor();
      } else {
        widget.setCursor( value );
      }
    },
    "bounds" : function( widget, value ) {
      var bounds = value;
      if( widget.getUserData( "tabFolder" ) !== null ) {
        bounds = org.eclipse.swt.TabUtil.adjustBounds( widget, bounds );
      }
      if( widget.getUserData( "scrolledComposite" ) === null ) {
        widget.setLeft( bounds[ 0 ] );
        widget.setTop( bounds[ 1 ] );
      }
      widget.setWidth( bounds[ 2 ] );
      widget.setHeight( bounds[ 3 ] );
    },
    "toolTip" : function( widget, toolTipText ) {
      if( toolTipText != null && toolTipText != "" ) {
        widget.setUserData( "toolTipText", toolTipText );
        var toolTip = org.eclipse.rwt.widgets.WidgetToolTip.getInstance()
        widget.setToolTip( toolTip );
        // make sure "boundToWidget" is initialized:
        if( toolTip.getParent() != null ) {  
          if( toolTip.getBoundToWidget() == widget ) {
            toolTip.updateText( widget );
          }
        }
      } else {
        widget.setToolTip( null );
        widget.setUserData( "toolTipText", null );
      }
    },
    "font" : function( widget, fontData ) {
      if( widget.setFont ) { // test if font property is supported - why wouldn't it? [tb]
        if( fontData === null ) {
          widget.resetFont();
        } else {
          var wm = org.eclipse.swt.WidgetManager.getInstance();
          // TODO [tb] : move helper
          var font = wm._createFont.apply( wm, fontData );
          widget.setFont( font );
        }
      }
    },
    "menu" : function( widget, value ) {
      org.eclipse.rwt.protocol.AdapterUtil.callWithTarget( value, function( menu ) {
        widget.setContextMenu( menu );
        var listener = org.eclipse.rwt.widgets.Menu.contextMenuHandler;
        if( menu == null ) {
          widget.removeEventListener( "contextmenu", listener );
        } else {
          widget.addEventListener( "contextmenu", listener );
        }
      } );
    }
  },

  _controlListeners : [
    "focus",
    "mouse",
    "key",
    "traverse",
    "menuDetect",
    "help",
    "activate"
  ],

  _controlListenerHandler : {
    "key" : function( widget, value ) {
      widget.setUserData( "keyListener", value ? true : null );
    },
    "traverse" : function( widget, value ) {
      widget.setUserData( "traverseListener", value ? true : null );
    },
    "focus" : function( widget, value ) {
      var context = org.eclipse.swt.EventUtil;
      var focusGained = org.eclipse.swt.EventUtil.focusGained;
      var focusLost = org.eclipse.swt.EventUtil.focusLost;
      if( value ) {
        widget.addEventListener( "focusin", focusGained, context );
        widget.addEventListener( "focusout", focusLost, context );
      } else {
        widget.removeEventListener( "focusin", focusGained, context );
        widget.removeEventListener( "focusout", focusLost, context );
      }
    },
    "mouse" : function( widget, value ) {
      var context = undefined;
      var mouseDown = org.eclipse.swt.EventUtil.mouseDown;
      var mouseUp = org.eclipse.swt.EventUtil.mouseUp;
      if( value ) {
        widget.addEventListener( "mousedown", mouseDown, context );
        widget.addEventListener( "mouseup", mouseUp, context );
      } else {
        widget.removeEventListener( "mousedown", mouseDown, context );
        widget.removeEventListener( "mouseup", mouseUp, context );
      }
    },
    "menuDetect" : function( widget, value ) {
      var context = undefined;
      var detectByKey = org.eclipse.swt.EventUtil.menuDetectedByKey;
      var detectByMouse = org.eclipse.swt.EventUtil.menuDetectedByMouse;
      if( value ) {
        widget.addEventListener( "keydown", detectByKey, context );
        widget.addEventListener( "mouseup", detectByMouse, context );
      } else {
        widget.removeEventListener( "keydown", detectByKey, context );
        widget.removeEventListener( "mouseup", detectByMouse, context );
      }
    },
    "help" : function( widget, value ) {
      var context = undefined;
      var helpRequested = org.eclipse.swt.EventUtil.helpRequested;
      if( value ) {
        widget.addEventListener( "keydown", helpRequested, context );
      } else {
        widget.removeEventListener( "keydown", helpRequested, context );
      }
    },
    "activate" : function( widget, value ) {
      var shell = org.eclipse.rwt.protocol.AdapterUtil.getShell( widget );
      if( shell ) {
        if( value ) {
          shell.addActivateListenerWidget( widget );
        } else {
          shell.removeActivateListenerWidget( widget );          
        }
      }
    }
  },
  
  _specialHandler : { 
    "backgroundGradient" : function( widget, value ) {
      var gradient = null;
      if( value ) {
        var colors = value[ 0 ];
        var percents = value[ 1 ];
        var vertical = value[ 2 ];
        gradient = [];
        for( var i = 0; i < colors.length; i++ ) {
          gradient[ i ] = [ percents[ i ] / 100, colors[ i ] ];
        }
        gradient.horizontal = !vertical;
      }
      widget.setBackgroundGradient( gradient );
    },
    "roundedBorder" : function( widget, value ) {
      if( value ) {
        var width = value[ 0 ];
        var color = value[ 1 ];
        var radii = value.slice( -4 );
        var border = new org.eclipse.rwt.Border( width, "rounded", color, radii );
        widget.setBorder( border );
      } else {
        widget.resetBorder();
      }
    }
  },
  
  ////////////////////////////////
  // lists and handler for adapter

  getControlDestructor : function() {
    return this._controlDestructor;
  },
  
  extendControlProperties : function( list ) {
    return list.concat( this._controlProperties );
  },
  
  extendControlPropertyHandler : function( handler ) {
    return qx.lang.Object.mergeWith( handler, this._controlPropertyHandler, false );
  },
  
  extendControlListeners : function( list ) {
    return list.concat( this._controlListeners );
  },

  extendControlListenerHandler : function( handler ) {
    return qx.lang.Object.mergeWith( handler, this._controlListenerHandler, false );    
  },

  getBackgroundGradientHandler : function() {
    return this._specialHandler.backgroundGradient;
  },

  getRoundedBorderHandler : function() {
    return this._specialHandler.roundedBorder;
  },
  
  getControlPropertyHandler : function( property ) {
    return this._controlPropertyHandler[ property ];
  },

  /////////////////////
  // Helper for handler

  addStatesForStyles : function( targetOject, styleArray ) {
    for( var i = 0; i < styleArray.length; i++ ) {
      targetOject.addState( "rwt_" + styleArray[ i ] );
    }
  },

  createStyleMap : function( styleArray ) {
    var result = {};
    for( var i = 0; i < styleArray.length; i++ ) {
      result[ styleArray[ i ] ] = true;
    }
    return result;
  },
  
  setParent : function( widget, parentId ) {
    var impl = this._setParentImplementation;
    this.callWithTarget( parentId, function( parent ) {
      impl( widget, parent );
    } );
  },

  _setParentImplementation : function( widget, parent ) {
    // TODO [rh] there seems to be a difference between add and setParent
    //      when using add sizes and clipping are treated differently
    // parent.add( widget );
    if( parent instanceof org.eclipse.swt.custom.ScrolledComposite ) {
      // [if] do nothing, parent is set in ScrolledComposite#setContent which is called from the 
      // server-side - see bug 349161
      widget.setUserData( "scrolledComposite", parent ); // Needed by "bounds" handler
    } else if ( parent instanceof qx.ui.pageview.tabview.TabView ) {
      widget.setUserData( "tabFolder", parent ); // Needed by "bounds" handler
    } else if( parent instanceof org.eclipse.swt.widgets.ExpandBar ) {
      parent.addWidget( widget );
    } else {
      widget.setParent( parent );
    }
  },

  callWithTarget : function( id, fun ) {
    var wm = org.eclipse.swt.WidgetManager.getInstance();
    if( id == null ) {
      fun( null );
    } else {
      var target = wm.findWidgetById( id );
      if( target ) {
        fun( target );
      } else {
        wm.addRegistrationCallback( id, fun );
      }
    }
  },

  getShell : function( widget ) {
    var result = widget;
    while( result && !( result instanceof org.eclipse.swt.widgets.Shell ) ) {
      result = result.getParent();
    }
    return result;
  }

};
