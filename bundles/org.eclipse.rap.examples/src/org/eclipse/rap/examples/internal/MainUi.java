/*******************************************************************************
 * Copyright (c) 2011, 2012 EclipseSource and others.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors:
 *    EclipseSource - initial API and implementation
 ******************************************************************************/
package org.eclipse.rap.examples.internal;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;

import org.eclipse.rap.examples.*;
import org.eclipse.rwt.RWT;
import org.eclipse.rwt.events.BrowserHistoryEvent;
import org.eclipse.rwt.events.BrowserHistoryListener;
import org.eclipse.rwt.internal.widgets.JSExecutor;
import org.eclipse.rwt.lifecycle.WidgetUtil;
import org.eclipse.swt.SWT;
import org.eclipse.swt.custom.ScrolledComposite;
import org.eclipse.swt.events.*;
import org.eclipse.swt.graphics.*;
import org.eclipse.swt.layout.*;
import org.eclipse.swt.widgets.*;
import org.osgi.framework.FrameworkUtil;
import org.osgi.framework.Version;


@SuppressWarnings("restriction")
public class MainUi {

  private static final String RAP_PAGE_URL = "http://eclipse.org/rap/";
  private static final int CONTENT_MIN_HEIGHT = 600;
  private static final int HEADER_HEIGHT = 155;
  private static final int HEADER_BAR_HEIGHT = 15;
  private static final int CENTER_AREA_WIDTH = 998;

  private static final RGB HEADER_BG = new RGB(49, 97, 156);
  private static final RGB HEADER_BAR_BG = new RGB( 52, 51, 47 );

  private Composite centerArea;
  private Composite navigation;

  public int createUI() {
    Display display = new Display();
    Shell shell = createMainShell( display );
    createContent( shell );
    attachHistoryListener();
    shell.open();
    selectContribution( Examples.getInstance().getContribution( "input" ) );
    while( !shell.isDisposed() ) {
      if( !display.readAndDispatch() ) {
        display.sleep();
      }
    }
    display.dispose();
    return 0;
  }

  private Shell createMainShell( Display display ) {
    Shell shell = new Shell( display, SWT.NO_TRIM );
    shell.setMaximized( true );
    shell.setData( WidgetUtil.CUSTOM_VARIANT, "mainshell" );
    return shell;
  }

  private void createContent( Shell shell ) {
    FormLayout layout = new FormLayout();
    shell.setLayout( layout );
    Composite header = createHeader( shell );
    header.setLayoutData( createHeaderFormData() );
    createContentArea( shell, header );
  }

  private Composite createHeader( Composite parent ) {
    Composite headerComp = new Composite( parent, SWT.NONE );
    Display display = parent.getDisplay();
    headerComp.setData( WidgetUtil.CUSTOM_VARIANT, "header" );
    headerComp.setBackgroundMode( SWT.INHERIT_DEFAULT );
    headerComp.setBackground( new Color( display, HEADER_BG ) );
    headerComp.setLayout( new FormLayout() );
    Composite headerCenterArea = createHeaderCenterArea( headerComp );
    createLogo( headerCenterArea, display );
    createTitle( headerCenterArea, display );
    createHeaderBar( headerComp, display );
    return headerComp;
  }

  private FormData createHeaderFormData() {
    FormData data = new FormData();
    data.top = new FormAttachment( 0 );
    data.left = new FormAttachment( 0 );
    data.right = new FormAttachment( 100 );
    data.height = HEADER_HEIGHT;
    return data;
  }

  private void createHeaderBar( Composite headerComp, Display display ) {
    Composite headerBar = new Composite( headerComp, SWT.NONE );
    headerBar.setBackgroundMode( SWT.INHERIT_DEFAULT );
    headerBar.setBackground( new Color( display, HEADER_BAR_BG ) );
    headerBar.setLayoutData( createHeaderBarFormData() );
  }

  private FormData createHeaderBarFormData() {
    FormData data = new FormData();
    data.bottom = new FormAttachment( 100 );
    data.left = new FormAttachment( 0 );
    data.right = new FormAttachment( 100 );
    data.top = new FormAttachment( 100, -HEADER_BAR_HEIGHT );
    return data;
  }

  private Composite createHeaderCenterArea( Composite parent ) {
    Composite headerCenterArea = new Composite( parent, SWT.NONE );
    headerCenterArea.setLayout( new FormLayout() );
    headerCenterArea.setLayoutData( createHeaderCenterAreaFormData() );
    return headerCenterArea;
  }

  private FormData createHeaderCenterAreaFormData() {
    FormData data = new FormData();
    data.left = new FormAttachment( 50, -CENTER_AREA_WIDTH / 2 );
    data.top = new FormAttachment( 0 );
    data.bottom = new FormAttachment( 100 );
    data.width = CENTER_AREA_WIDTH;
    return data;
  }

  private void createLogo( Composite headerComp, Display display ) {
    Label logoLabel = new Label( headerComp, SWT.NONE );
    Image rapLogo = getImage( display, "RAP-logo.png" );
    logoLabel.setImage( rapLogo );
    logoLabel.setLayoutData( createLogoFormData( rapLogo ) );
    makeLink( logoLabel, RAP_PAGE_URL );
  }

  private void createTitle( Composite headerComp, Display display ) {
    Label title = new Label( headerComp, SWT.NONE );
    title.setText( "Demo" );
    title.setLayoutData( createTitleFormData() );
    title.setData(  WidgetUtil.CUSTOM_VARIANT, "title" );
  }

  private void createContentArea( Composite parent, Composite header ) {
    Composite contentComposite = new Composite( parent, SWT.NONE );
    contentComposite.setData(  WidgetUtil.CUSTOM_VARIANT, "mainContentArea" );
    contentComposite.setLayout( new FormLayout() );
    contentComposite.setLayoutData( createMainContentFormData( header ) );
    navigation = createNavigation( contentComposite );
    Composite footer = createFooter( contentComposite );
    ScrolledComposite scrolledComp = createScrolledComp( contentComposite, footer );
    centerArea = createCenterArea( scrolledComp );
  }

  private ScrolledComposite createScrolledComp( Composite parent, Composite footer ) {
    ScrolledComposite scrolledComp = new ScrolledComposite( parent, SWT.V_SCROLL );
    scrolledComp.setLayoutData( createScrolledCompFormData( footer ) );
    scrolledComp.setMinHeight( CONTENT_MIN_HEIGHT );
    scrolledComp.setExpandVertical( true );
    scrolledComp.setExpandHorizontal( true );
    return scrolledComp;
  }

  private FormData createScrolledCompFormData( Composite footer ) {
    int centerWidthPlusMargin = CENTER_AREA_WIDTH + 20;
    FormData data = new FormData();
    data.left = new FormAttachment( 50, - ( centerWidthPlusMargin / 2 ) );
    data.top = new FormAttachment( navigation.getParent() );
    data.bottom = new FormAttachment( footer );
    data.width = centerWidthPlusMargin;
    return data;
  }

  private Composite createCenterArea( ScrolledComposite parent ) {
    Composite centerArea = new Composite( parent, SWT.NONE );
    centerArea.setLayout( new FillLayout() );
    centerArea.setData(  WidgetUtil.CUSTOM_VARIANT, "centerArea" );
    parent.setContent( centerArea );
    return centerArea;
  }

  private Composite createFooter( Composite contentComposite ) {
    Composite footer = new Composite( contentComposite, SWT.NONE );
    footer.setLayout( new FormLayout() );
    footer.setData(  WidgetUtil.CUSTOM_VARIANT, "footer" );
    footer.setLayoutData( createFooterFormData() );
    Label label = new Label( footer, SWT.NONE );
    label.setData(  WidgetUtil.CUSTOM_VARIANT, "footerLabel" );
    label.setText( "RAP version: " + getRapVersion() );
    label.setLayoutData( createFooterLabelFormData( footer ) );
    return footer;
  }

  private FormData createFooterFormData() {
    FormData data = new FormData();
    data.left = new FormAttachment( 50, ( -CENTER_AREA_WIDTH / 2 ) );
    data.top = new FormAttachment( 100, -40 );
    data.bottom = new FormAttachment( 100 );
    data.width = CENTER_AREA_WIDTH + 10 - 2;
    return data;
  }

  private FormData createFooterLabelFormData( Composite footer ) {
    FormData data = new FormData();
    data.top = new FormAttachment( 50, -10 );
    data.right = new FormAttachment( 100, -15 );
    return data;
  }

  private FormData createMainContentFormData( Composite header ) {
    FormData data = new FormData();
    data.top = new FormAttachment( header, 0 );
    data.left = new FormAttachment( 0, 0 );
    data.right = new FormAttachment( 100, 0 );
    data.bottom = new FormAttachment( 100, 0 );
    return data;
  }

  private Composite createNavigation( Composite parent ) {
    Composite navBar = new Composite( parent, SWT.NONE);
    navBar.setLayout( new FormLayout() );
    navBar.setLayoutData( createNavBarFormData() );
    navBar.setData(  WidgetUtil.CUSTOM_VARIANT, "nav-bar" );
    Composite nav = new Composite( navBar, SWT.NONE );
    nav.setLayout( new GridLayout( 9, false ) );
    nav.setLayoutData( createNavigationFormData() );
    nav.setData(  WidgetUtil.CUSTOM_VARIANT, "navigation" );
    createNavigationControls( nav );
    return nav;
  }

  private FormData createNavBarFormData() {
    FormData data = new FormData();
    data.top = new FormAttachment( 0 );
    data.left = new FormAttachment( 0 );
    data.right = new FormAttachment( 100 );
    return data;
  }

  private FormData createNavigationFormData() {
    FormData data = new FormData();
    data.left = new FormAttachment( 50, ( -CENTER_AREA_WIDTH / 2 ) - 13 );
    data.top = new FormAttachment( 0 );
    data.bottom = new FormAttachment( 100 );
    data.width = CENTER_AREA_WIDTH;
    return data;
  }

  private void createNavigationControls( Composite parent ) {
    List<IExampleContribution> contributions = Examples.getInstance().getContributions();
    for( final IExampleContribution page : contributions ) {
      createNavigationControl( parent, page );
    }
  }

  private void createNavigationControl( Composite parent, final IExampleContribution page ) {
    String categoryId = page.getCategoryId();
    if( categoryId != null ) {
      createNavigationDropDown( parent, page );
    } else {
      createNavigationButton( parent, page );
    }
  }

  private void createNavigationButton( Composite parent, final IExampleContribution page ) {
    ToolBar toolBar = new ToolBar( parent, SWT.HORIZONTAL );
    GridData layoutData = new GridData( SWT.LEFT, SWT.LEFT, true, false );
    toolBar.setLayoutData( layoutData );
    toolBar.setData( WidgetUtil.CUSTOM_VARIANT, "navigation" );
    toolBar.setData( page.getId() );
    final ToolItem toolItem = new ToolItem( toolBar, SWT.PUSH );
    toolItem.setData( WidgetUtil.CUSTOM_VARIANT, "navigation" );
    toolItem.setText( page.getTitle().replace( "&", "&&" ) );
    toolItem.addSelectionListener( new SelectionAdapter() {
      @Override
      public void widgetSelected( SelectionEvent e ) {
        selectContribution( page );
      }
    } );
  }

  private void createNavigationDropDown( Composite parent, IExampleContribution page ) {
    DropDownNavigation existingDropDown = getNavigationEntryByCategoryId( parent, page.getCategoryId() );
    if( existingDropDown != null ) {
      existingDropDown.addNavigationItem( page );
    } else {
      new DropDownNavigation( parent, page ) {
        @Override
        protected void onSelectContribution( IExampleContribution page ) {
          MainUi.this.selectContribution( page );
        }
      };
    }
  }

  private DropDownNavigation getNavigationEntryByCategoryId( Composite parent, String categoryId ) {
    DropDownNavigation result = null;
    Control[] children = parent.getChildren();
    for( Control element : children ) {
      if( element instanceof DropDownNavigation ) {
        DropDownNavigation entry = ( DropDownNavigation ) element;
        if( entry.getCategoryId().equals( categoryId ) ) {
          result = entry;
          break;
        }
      }
    }
    return result;
  }

  private void selectContribution( IExampleContribution page ) {
    selectNavigationEntry( page );
    activate( page );
  }

  private void selectNavigationEntry( IExampleContribution page ) {
    Control[] children = navigation.getChildren();
    for( Control control : children ) {
      if( control instanceof ToolBar ) {
        changeSelectedToolBarEntry( page, (ToolBar) control );
      } else if( control instanceof DropDownNavigation ) {
        changeSelectedDropDownEntry( page, (DropDownNavigation) control );
      }
    }
  }

  private void changeSelectedToolBarEntry( IExampleContribution page, ToolBar navEntry ) {
    ToolItem item = navEntry.getItem( 0 );
    if( navEntry.getData().equals( page.getId() ) ) {
      item.setData( WidgetUtil.CUSTOM_VARIANT, "selected" );
    } else {
      item.setData( WidgetUtil.CUSTOM_VARIANT, "navigation" );
    }
  }

  private void changeSelectedDropDownEntry( IExampleContribution page,
                                            DropDownNavigation navEntry ) {
    boolean belongsToDropDownNav = pageBelongsToDropDownNav( page, navEntry );
    ToolItem item = ( (ToolBar) navEntry.getChildren()[ 0 ] ).getItem( 0 );
    if( belongsToDropDownNav ) {
      item.setData( WidgetUtil.CUSTOM_VARIANT, "selected" );
    } else {
      item.setData( WidgetUtil.CUSTOM_VARIANT, "navigation" );
    }
  }

  @SuppressWarnings("unchecked")
  private boolean pageBelongsToDropDownNav( IExampleContribution page, DropDownNavigation navEntry ) {
    boolean result = false;
    ArrayList<String> navEntryData = (ArrayList<String>) navEntry.getData();
    for( String id : navEntryData ) {
      if( page.getId().equals( id ) ) {
        result = true;
        break;
      }
    }
    return result;
  }

  private void activate( IExampleContribution page ) {
    IExamplePage examplePage = page.createPage();
    if( examplePage != null ) {
      RWT.getBrowserHistory().createEntry( page.getId(), page.getTitle() );
      Control[] children = centerArea.getChildren();
      for( Control child : children ) {
        child.dispose();
      }
      Composite contentComp = ExampleUtil.initPage( page.getTitle(), centerArea );
      examplePage.createControl( contentComp );
      centerArea.layout( true, true );
    }
  }

  private FormData createLogoFormData( Image rapLogo ) {
    FormData data = new FormData();
    data.left = new FormAttachment( 0 );
    int logoHeight = rapLogo.getBounds().height;
    data.top = new FormAttachment( 50, -( logoHeight / 2 ) );
    return data;
  }

  private FormData createTitleFormData() {
    FormData data = new FormData();
    data.bottom = new FormAttachment( 100, -33 );
    data.left = new FormAttachment( 0, 250 );
    return data;
  }

  private void attachHistoryListener() {
    RWT.getBrowserHistory().addBrowserHistoryListener( new BrowserHistoryListener() {

      public void navigated( BrowserHistoryEvent event ) {
        IExampleContribution page = Examples.getInstance().getContribution( event.entryId );
        if( page != null ) {
          selectContribution( page );
        }
      }
    } );
  }

  private static Image getImage( Display display, String path ) {
    ClassLoader classLoader = MainUi.class.getClassLoader();
    InputStream inputStream = classLoader.getResourceAsStream( "resources/" + path );
    Image result = null;
    if( inputStream != null ) {
      try {
        result = new Image( display, inputStream );
      } finally {
        try {
          inputStream.close();
        } catch( IOException e ) {
          // ignore
        }
      }
    }
    return result;
  }

  private static String getRapVersion() {
    Version version = FrameworkUtil.getBundle( RWT.class ).getVersion();
    StringBuilder resultBuffer = new StringBuilder( 20 );
    resultBuffer.append( version.getMajor() );
    resultBuffer.append( '.' );
    resultBuffer.append( version.getMinor() );
    resultBuffer.append( '.' );
    resultBuffer.append( version.getMicro() );
    resultBuffer.append( " (Build " );
    resultBuffer.append( version.getQualifier() );
    resultBuffer.append( ')' );
    return resultBuffer.toString();
  }

  private static void makeLink( Label control, final String url ) {
    control.setCursor( control.getDisplay().getSystemCursor( SWT.CURSOR_HAND ) );
    control.addMouseListener( new MouseAdapter() {
      @Override
      public void mouseDown( MouseEvent e ) {
        JSExecutor.executeJS( "window.location.href = '" + url + "'" );
      }
    } );
  }

}
