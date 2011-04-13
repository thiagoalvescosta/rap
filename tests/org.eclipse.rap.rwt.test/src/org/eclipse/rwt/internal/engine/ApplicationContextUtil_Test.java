/*******************************************************************************
 * Copyright (c) 2011 Frank Appel and others.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors:
 *    Frank Appel - initial API and implementation
 ******************************************************************************/
package org.eclipse.rwt.internal.engine;

import javax.servlet.ServletContext;
import javax.servlet.http.HttpSession;

import junit.framework.TestCase;

import org.eclipse.rwt.*;
import org.eclipse.rwt.internal.AdapterFactoryRegistry;
import org.eclipse.rwt.internal.ConfigurationReader;
import org.eclipse.rwt.internal.branding.BrandingManager;
import org.eclipse.rwt.internal.lifecycle.*;
import org.eclipse.rwt.internal.resources.*;
import org.eclipse.rwt.internal.service.*;
import org.eclipse.rwt.internal.theme.ThemeAdapterManager;
import org.eclipse.rwt.internal.theme.ThemeManagerHolder;
import org.eclipse.rwt.service.ISessionStore;
import org.eclipse.swt.internal.graphics.*;
import org.eclipse.swt.internal.widgets.DisplaysHolder;


public class ApplicationContextUtil_Test extends TestCase {
  
  public void testRegisterDefaultApplicationContext() {
    Fixture.createServiceContext();

    ISessionStore session = ContextProvider.getSession();
    HttpSession httpSession = session.getHttpSession();
    ServletContext servletContext = httpSession.getServletContext();
    ApplicationContext applicationContext
      = ApplicationContextUtil.registerDefaultApplicationContext( servletContext );

    assertNotNull( applicationContext );
    assertNotNull( getSingleton( ThemeManagerHolder.class ) );
    assertSame( applicationContext.getInstance( ThemeManagerHolder.class ),
                getSingleton( ThemeManagerHolder.class ) );
    assertNotNull( getSingleton( BrandingManager.class ) );
    assertSame( applicationContext.getInstance( BrandingManager.class ),
                getSingleton( BrandingManager.class ) );
    assertNotNull( getSingleton( PhaseListenerRegistry.class ) );
    assertSame( applicationContext.getInstance( PhaseListenerRegistry.class ),
                getSingleton( PhaseListenerRegistry.class ) );
    assertNotNull( getSingleton( LifeCycleFactory.class ) );
    assertSame( applicationContext.getInstance( LifeCycleFactory.class ),
                getSingleton( LifeCycleFactory.class ) );
    assertNotNull( getSingleton( EntryPointManager.class ) );
    assertSame( applicationContext.getInstance( EntryPointManager.class ),
                getSingleton( EntryPointManager.class ) );
    assertNotNull( getSingleton( ResourceFactory.class ) );
    assertSame( applicationContext.getInstance( ResourceFactory.class ),
                getSingleton( ResourceFactory.class ) );
    assertNotNull( getSingleton( ImageFactory.class ) );
    assertSame( applicationContext.getInstance( ImageFactory.class ),
                getSingleton( ImageFactory.class ) );
    assertNotNull( getSingleton( InternalImageFactory.class ) );
    assertSame( applicationContext.getInstance( InternalImageFactory.class ),
                getSingleton( InternalImageFactory.class ) );
    assertNotNull( getSingleton( ImageDataFactory.class ) );
    assertSame( applicationContext.getInstance( ImageDataFactory.class ),
                getSingleton( ImageDataFactory.class ) );
    assertNotNull( getSingleton( FontDataFactory.class ) );
    assertSame( applicationContext.getInstance( FontDataFactory.class ),
                getSingleton( FontDataFactory.class ) );
    assertNotNull( getSingleton( AdapterFactoryRegistry.class ) );
    assertSame( applicationContext.getInstance( AdapterFactoryRegistry.class ),
                getSingleton( AdapterFactoryRegistry.class ) );
    assertNotNull( getSingleton( SettingStoreManager.class ) );
    assertSame( applicationContext.getInstance( SettingStoreManager.class ),
                getSingleton( SettingStoreManager.class ) );
    assertNotNull( getSingleton( ServiceManager.class ) );
    assertSame( applicationContext.getInstance( ServiceManager.class ),
                getSingleton( ServiceManager.class ) );
    assertNotNull( getSingleton( ResourceRegistry.class ) );
    assertSame( applicationContext.getInstance( ResourceRegistry.class ),
                getSingleton( ResourceRegistry.class ) );
    assertNotNull( getSingleton( ConfigurationReader.class ) );
    assertSame( applicationContext.getInstance( ConfigurationReader.class ),
                getSingleton( ConfigurationReader.class ) );
    assertNotNull( getSingleton( ResourceManagerProvider.class ) );
    assertSame( applicationContext.getInstance( ResourceManagerProvider.class ),
                getSingleton( ResourceManagerProvider.class ) );
    assertNotNull( getSingleton( StartupPageConfigurer.class ) );
    assertSame( applicationContext.getInstance( StartupPageConfigurer.class ),
                getSingleton( StartupPageConfigurer.class ) );
    assertNotNull( getSingleton( StartupPage.class ) );
    assertSame( applicationContext.getInstance( StartupPage.class ),
                getSingleton( StartupPage.class ) );
    assertNotNull( getSingleton( DisplaysHolder.class ) );
    assertSame( applicationContext.getInstance( DisplaysHolder.class ),
                getSingleton( DisplaysHolder.class ) );
    assertNotNull( getSingleton( ThemeAdapterManager.class ) );
    assertSame( applicationContext.getInstance( ThemeAdapterManager.class ),
                getSingleton( ThemeAdapterManager.class ) );
    assertNotNull( getSingleton( JSLibraryConcatenator.class ) );
    assertSame( applicationContext.getInstance( JSLibraryConcatenator.class ),
                getSingleton( JSLibraryConcatenator.class ) );
    assertNotNull( getSingleton( TextSizeStorageRegistry.class ) );
    assertSame( applicationContext.getInstance( TextSizeStorageRegistry.class ),
                getSingleton( TextSizeStorageRegistry.class ) );
    
    ApplicationContextUtil.deregisterApplicationContext( servletContext );
    try {
      getSingleton( ThemeManagerHolder.class );
      fail( "After deregistration there must be no context available." );
    } catch( IllegalStateException expected ) {
    }
  }
  
  public void testRegisterApplicationContext() {
    TestServletContext servletContext = new TestServletContext();
    ApplicationContext applicationContext = new ApplicationContext();
    
    ApplicationContextUtil.registerApplicationContext( servletContext, applicationContext );
    ApplicationContext found = ApplicationContextUtil.getApplicationContext( servletContext );
    assertSame( applicationContext, found );
    
    ApplicationContextUtil.deregisterApplicationContext( servletContext );
    assertNull( ApplicationContextUtil.getApplicationContext( servletContext ) );
  }
  
  public void testRegisterApplicationContextOnSessionStore() {
    SessionStoreImpl sessionStore = new SessionStoreImpl( new TestSession() );
    ApplicationContext applicationContext = new ApplicationContext();

    ApplicationContextUtil.registerApplicationContext( sessionStore, applicationContext );
    ApplicationContext found = ApplicationContextUtil.getApplicationContext( sessionStore );
    assertSame( applicationContext, found );
    
    ApplicationContextUtil.deregisterApplicationContext( sessionStore );
    assertNull( ApplicationContextUtil.getApplicationContext( sessionStore ) );
  }
  
  public void testRunWithInstance() {
    ApplicationContext applicationContext = new ApplicationContext();
    final ApplicationContext[] found = new ApplicationContext[ 1 ];
    Runnable runnable = new Runnable() {
      public void run() {
        found[0] = ApplicationContextUtil.getInstance();
      }
    };

    boolean before = ApplicationContextUtil.hasContext();
    ApplicationContextUtil.runWithInstance( applicationContext, runnable );
    boolean after = ApplicationContextUtil.hasContext();

    assertFalse( before );
    assertSame( applicationContext, found[ 0 ] );
    assertFalse( after );
  }

  public void testRunWithInstanceWithException() {
    final RuntimeException expected = new RuntimeException();
    Runnable runnable = new Runnable() {
      public void run() {
        throw expected;
      }
    };
    
    boolean before = ApplicationContextUtil.hasContext();
    RuntimeException actual = runWithExceptionExpected( runnable );
    boolean after = ApplicationContextUtil.hasContext();
    
    assertFalse( before );
    assertSame( expected, actual );
    assertFalse( after );
  }
  
  public void testParamApplicationContextNotNull() {
    try {
      ApplicationContextUtil.runWithInstance( null, new Runnable() {
        public void run() {}
      } );
      fail();
    } catch( NullPointerException expected ) {
    }
  }
  
  public void testParamRunnableNotNull() {
    try {
      ApplicationContextUtil.runWithInstance( new ApplicationContext(), null );
      fail();
    } catch( NullPointerException expected ) {
    }
  }
  
  public void testRunWithInstanceWithNestedCall() {
    final ApplicationContext applicationContext = new ApplicationContext();
    Runnable runnable = new Runnable() {
      public void run() {
        ApplicationContextUtil.runWithInstance( applicationContext, this );
      }
    };
    
    try {
      ApplicationContextUtil.runWithInstance( applicationContext, runnable );
      fail( "Nested calls in same thread of runWithInstance are not allowed" );
    } catch( IllegalStateException expected ) {
    }
  }
  
  public void testGetInstanceWithoutContextProviderRegistration() {
    try {
      ApplicationContextUtil.getInstance();
      fail();
    } catch( IllegalStateException expected ) {
    }
  }

  private static Object getSingleton( Class singletonType ) {
    return ApplicationContext.getSingleton( singletonType );
  }

  private static RuntimeException runWithExceptionExpected( Runnable runnable ) {
    RuntimeException actual = null;
    try {
      ApplicationContextUtil.runWithInstance( new ApplicationContext(), runnable );
      fail();
    } catch( RuntimeException runtimeException ) {
      actual = runtimeException;
    }
    return actual;
  }
}
