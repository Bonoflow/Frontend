import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing-module';
import { App } from './app';

import { SidenavComponent } from './public/components/sidenav/sidenav.component';
import { HeaderComponent } from './public/components/header/header.component';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatCardModule } from '@angular/material/card';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatDialogModule } from '@angular/material/dialog';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { HttpClientModule } from '@angular/common/http';
import { RegisterClient } from './iam/components/register-client/register-client';
import { Home } from './public/pages/home/home';
import { SignupClient } from './iam/pages/signup-client/signup-client';
import {LoginComponent} from './iam/pages/login/login.component';
import { BondForm } from './bonds/components/bond-form/bond-form';
import { BondPage } from './bonds/pages/bond-page/bond-page';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import { BondList } from './bonds/components/bond-list/bond-list';
import { BondDetail } from './bonds/components/bond-detail/bond-detail';
import {MatTabsModule} from '@angular/material/tabs';

@NgModule({
  declarations: [
    App,
    LoginComponent,
    SidenavComponent,
    HeaderComponent,
    Home,
    RegisterClient,
    SignupClient,
    BondForm,
    BondPage,
    BondList,
    BondDetail,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    MatButtonToggleModule,
    MatFormFieldModule,
    MatCheckboxModule,
    MatIconModule,
    MatListModule,
    MatCardModule,
    MatSidenavModule,
    MatToolbarModule,
    MatDialogModule,
    FormsModule,
    MatGridListModule,
    MatButtonModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule,
    MatTableModule,
    MatPaginatorModule,
    MatTooltipModule,
    ReactiveFormsModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
    MatTabsModule
  ],
  providers: [
    provideAnimationsAsync()
  ],
  bootstrap: [App]
})
export class AppModule { }
