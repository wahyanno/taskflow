import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

// Core Interceptors
import { JwtInterceptor } from './core/interceptors/jwt.interceptor';

/**
 * AppModule - Root module aplikasi Angular TaskFlow
 *
 * Konfigurasi:
 * - HttpClientModule: untuk semua HTTP request ke API
 * - ReactiveFormsModule: untuk form login, register, project, task
 * - JwtInterceptor: otomatis inject JWT Bearer token ke setiap HTTP request
 */
@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    ReactiveFormsModule,
    FormsModule,
  ],
  providers: [
    /**
     * Register JwtInterceptor sebagai HTTP_INTERCEPTORS provider
     * multi: true → memungkinkan multiple interceptors
     */
    {
      provide: HTTP_INTERCEPTORS,
      useClass: JwtInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
