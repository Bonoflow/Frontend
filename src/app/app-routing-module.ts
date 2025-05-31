import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {LoginComponent} from './iam/pages/login/login.component';
import {SignupClient} from './iam/pages/signup-client/signup-client';
import {Home} from './public/pages/home/home';
import {BondPage} from './bonds/pages/bond-page/bond-page';
import {BondForm} from './bonds/components/bond-form/bond-form';
import {BondDetail} from './bonds/components/bond-detail/bond-detail';

const routes: Routes = [
  {path: '', redirectTo: 'login', pathMatch: 'full'},
  {path: 'login', component: LoginComponent},
  {path: 'sign-up/client', component: SignupClient},
  {path: 'client/home', component: Home},
  {path: 'client/profile', component: Home},
  {path: 'client/bonds', component: BondPage},
  {path: 'client/bond-form', component: BondForm},
  { path: 'client/bond-form', component: BondForm },
  { path: 'client/bond-form/:id/edit', component: BondForm },
  { path: 'client/bond/detail/:id', component: BondDetail },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
