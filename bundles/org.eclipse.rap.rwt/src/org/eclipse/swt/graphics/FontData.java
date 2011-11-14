/*******************************************************************************
 * Copyright (c) 2002, 2011 Innoopract Informationssysteme GmbH and others.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors:
 *    Innoopract Informationssysteme GmbH - initial API and implementation
 *    EclipseSource - ongoing development
 ******************************************************************************/
package org.eclipse.swt.graphics;

import org.eclipse.swt.*;
import org.eclipse.swt.internal.SerializableCompatibility;


/**
 * Instances of this class describe fonts.
 * <p>
 * Application code does <em>not</em> need to explicitly release the
 * resources managed by each instance when those instances are no longer
 * required, and thus no <code>dispose()</code> method is provided.
 * 
 * @see Font
 * @since 1.0
 */
public final class FontData implements SerializableCompatibility {

  private String name;
  private int height;
  private int style;
  private String locale;

  /**
   * Constructs a new uninitialized font data.
   * @since 1.4
   */
  public FontData() {
    this( "", 12, SWT.NORMAL );
  }

  /**  
   * Constructs a new font data given a font name,
   * the height of the desired font in points, 
   * and a font style.
   *
   * @param name the name of the font (must not be null)
   * @param height the font height in points
   * @param style a bit or combination of NORMAL, BOLD, ITALIC
   *
   * @exception IllegalArgumentException <ul>
   *    <li>ERROR_NULL_ARGUMENT - when the font name is null</li>
   *    <li>ERROR_INVALID_ARGUMENT - if the height is negative</li>
   * </ul>
   */
  public FontData( String name, int height, int style ) {
    if( name == null ) {
      SWT.error( SWT.ERROR_NULL_ARGUMENT );
    }
    if( height < 0 ) {
      SWT.error( SWT.ERROR_INVALID_ARGUMENT );
    }
    this.name = name;
    this.height = height;
    this.style = checkFontStyle( style );
    this.locale = "";
  }

  /**
   * Constructs a new FontData given a string representation
   * in the form generated by the <code>FontData.toString</code>
   * method.
   * <!--
   * <p>
   * Note that the representation varies between platforms,
   * and a FontData can only be created from a string that was 
   * generated on the same platform.
   * </p>
   * -->
   * 
   * @param string the string representation of a <code>FontData</code> (must not be null)
   *
   * @exception IllegalArgumentException <ul>
   *              <li>ERROR_NULL_ARGUMENT - if the argument is null</li>
   *    <li>ERROR_INVALID_ARGUMENT - if the argument does not represent a valid description</li>
   *              </ul>
   *
   * @see #toString
   */
  public FontData( String string ) {
    if( string == null ) {
      SWT.error( SWT.ERROR_NULL_ARGUMENT );
    }
    int start = 0;
    int end = string.indexOf( '|' );
    if( end == -1 ) {
      SWT.error( SWT.ERROR_INVALID_ARGUMENT );
    }
    String version1 = string.substring( start, end );
    try {
      if( Integer.parseInt( version1 ) != 1 ) {
        SWT.error( SWT.ERROR_INVALID_ARGUMENT );
      }
    } catch( NumberFormatException e ) {
      SWT.error( SWT.ERROR_INVALID_ARGUMENT );
    }
    start = end + 1;
    end = string.indexOf( '|', start );
    if( end == -1 ) {
      SWT.error( SWT.ERROR_INVALID_ARGUMENT );
    }
    String name = string.substring( start, end );
    start = end + 1;
    end = string.indexOf( '|', start );
    if( end == -1 ) {
      SWT.error( SWT.ERROR_INVALID_ARGUMENT );
    }
    int height = 0;
    try {
      height = Integer.parseInt( string.substring( start, end ) );
    } catch( NumberFormatException e ) {
      SWT.error( SWT.ERROR_INVALID_ARGUMENT );
    }
    start = end + 1;
    end = string.indexOf( '|', start );
    if( end == -1 ) {
      SWT.error( SWT.ERROR_INVALID_ARGUMENT );
    }
    int style = 0;
    try {
      style = Integer.parseInt( string.substring( start, end ) );
    } catch( NumberFormatException e ) {
      SWT.error( SWT.ERROR_INVALID_ARGUMENT );
    }
    start = end + 1;
    end = string.indexOf( '|', start );
    this.name = name;
    this.height = height;
    this.style = style;
    this.locale = "";
  }

  /**
   * Returns a string representation of the receiver which is suitable for
   * constructing an equivalent instance using the <code>FontData(String)</code>
   * constructor.
   * 
   * @return a string representation of the FontData
   */
  public String toString() {
    StringBuffer buffer = new StringBuffer();
    buffer.append( "1|" ); //$NON-NLS-1$
    buffer.append( getName() );
    buffer.append( "|" ); //$NON-NLS-1$
    buffer.append( getHeight() );
    buffer.append( "|" ); //$NON-NLS-1$
    buffer.append( getStyle() );
    buffer.append( "|" ); //$NON-NLS-1$
    return buffer.toString();
  }

  /**
   * Returns the height of the receiver in points.
   * 
   * @return the height of this FontData
   * @see #setHeight(int)
   */
  public int getHeight() {
    return height;
  }
  /**
   * Returns the name of the receiver.
   * 
   * @return the name of this <code>FontData</code>
   * @see #setName
   */
  public String getName() {
    return name;
  }

  /**
   * Returns the style of the receiver which is a bitwise OR of 
   * one or more of the <code>SWT</code> constants NORMAL, BOLD
   * and ITALIC.
   * 
   * @return the style of this <code>FontData</code>
   * @see #setStyle
   */
  public int getStyle() {
    return style;
  }

  /**
   * Returns the locale of the receiver.
   * <p>
   * The locale determines which platform character set this
   * font is going to use. Widgets and graphics operations that
   * use this font will convert UNICODE strings to the platform
   * character set of the specified locale.
   * </p>
   * <p>
   * On platforms where there are multiple character sets for a
   * given language/country locale, the variant portion of the
   * locale will determine the character set.
   * </p>
   * 
   * @return the <code>String</code> representing a Locale object
   * @since 1.3
   */
  public String getLocale () {
    return locale;
  }

  /**
   * Sets the height of the receiver. The parameter is
   * specified in terms of points, where a point is one
   * seventy-second of an inch.
   *
   * @param height the height of the <code>FontData</code>
   *
   * @exception IllegalArgumentException <ul>
   *    <li>ERROR_INVALID_ARGUMENT - if the height is negative</li>
   * </ul>
   * 
   * @see #getHeight
   * @since 1.4
   */
  public void setHeight( int height ) {
    if( height < 0 ) {
      SWT.error( SWT.ERROR_INVALID_ARGUMENT );
    }
    this.height = height;
  }

  /**
   * Sets the name of the receiver.
   *
   * @param name the name of the font data (must not be null)
   * @exception IllegalArgumentException <ul>
   *    <li>ERROR_NULL_ARGUMENT - when the font name is null</li>
   * </ul>
   *
   * @see #getName
   * @since 1.4
   */
  public void setName( String name ) {
    if( name == null ) {
      SWT.error( SWT.ERROR_NULL_ARGUMENT );
    }
    this.name = name;
  }

  /**
   * Sets the style of the receiver to the argument which must
   * be a bitwise OR of one or more of the <code>SWT</code> 
   * constants NORMAL, BOLD and ITALIC.  All other style bits are
   * ignored.
   *
   * @param style the new style for this <code>FontData</code>
   *
   * @see #getStyle
   * @since 1.4
   */
  public void setStyle( int style ) {
    this.style = style;
  }

  /**
   * Sets the locale of the receiver.
   * <p>
   * The locale determines which platform character set this
   * font is going to use. Widgets and graphics operations that
   * use this font will convert UNICODE strings to the platform
   * character set of the specified locale.
   * </p>
   * <p>
   * On platforms where there are multiple character sets for a
   * given language/country locale, the variant portion of the
   * locale will determine the character set.
   * </p>
   * 
   * @param locale the <code>String</code> representing a Locale object
   * @see java.util.Locale#toString
   * @since 1.4
   */
  public void setLocale( String locale ) {
    String result = "";
    if( locale != null ) {
      int length = locale.length();
      if( length > 0 ) {
        char sep = '_';
        result = locale;
        for( int i = 0; i < 2; i++ ) {
          if( length > 0 && result.charAt( 0 ) == sep ) {
            result = result.substring( 1 );
            length -= 1;
          }
        }
        if( length > 0 && result.charAt( length - 1 ) == sep ) {
          result = result.substring( 0, length - 1 );
        }
      }
    }
    this.locale = result;
  }

  /**
   * Compares the argument to the receiver, and returns true
   * if they represent the <em>same</em> object using a class
   * specific comparison.
   *
   * @param obj the object to compare with this object
   * @return <code>true</code> if the object is the same as this object and <code>false</code> otherwise
   *
   * @see #hashCode
   */
  public boolean equals( Object obj ) {
    boolean result = false;
    if( obj instanceof FontData ) {
      FontData toCompare = ( FontData )obj;
      // name can never be null
      result = name.equals( toCompare.name )
               && height == toCompare.height
               && style == toCompare.style;
    }
    return result;
  }

  /**
   * Returns an integer hash code for the receiver. Any two 
   * objects that return <code>true</code> when passed to 
   * <code>equals</code> must return the same value for this
   * method.
   * 
   * @return the receiver's hash
   *
   * @see #equals
   */
  public int hashCode() {
    return name.hashCode() ^ height << 8 ^ style;
  }

  private static int checkFontStyle( int style ) {
    int result = SWT.NORMAL;
    if( ( style & SWT.BOLD ) != 0 ) {
      result |= SWT.BOLD;
    }
    if( ( style & SWT.ITALIC ) != 0 ) {
      result |= SWT.ITALIC;
    }
    return result;
  }
}
