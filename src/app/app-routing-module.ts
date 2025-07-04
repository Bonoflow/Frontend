import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {LoginComponent} from './iam/pages/login/login.component';
import {SignupClient} from './iam/pages/signup-client/signup-client';
import {Home} from './public/pages/home/home';
import {BondPage} from './bonds/pages/bond-page/bond-page';
import {BondForm} from './bonds/components/bond-form/bond-form';
import {BondDetail} from './bonds/components/bond-detail/bond-detail';
import {ProfilePage} from './profiles/pages/profile-page/profile-page';
import {ConfigurationPage} from './users/pages/configuration-page/configuration-page';
import {SignupRole} from './iam/pages/signup-role/signup-role';
import {SignupInvestor} from './iam/pages/signup-investor/signup-investor';
import {ProfileInvestor} from './profiles/pages/profile-investor/profile-investor';
import {HomeInvestor} from './public/pages/home-investor/home-investor';
import {BondPageInvestor} from './bonds/pages/bond-page-investor/bond-page-investor';
import {PortfolioInvestor} from './bonds/components/portfolio-investor/portfolio-investor';
import {BondDetailInvestor} from './bonds/components/bond-detail-investor/bond-detail-investor';



const routes: Routes = [
  {path: '', redirectTo: 'login', pathMatch: 'full'},
  {path: 'login', component: LoginComponent},
  {path: 'sign-up/role', component: SignupRole},
  {path: 'sign-up/investor', component: SignupInvestor},
  {path: 'sign-up/client', component: SignupClient},
  {path: 'client/home', component: Home},
  {path: 'investor/home', component: HomeInvestor},
  {path: 'client/bonds', component: BondPage},
  {path: 'investor/bonds', component: BondPageInvestor},
  {path: 'client/bond-form', component: BondForm},
  { path: 'client/bond-form', component: BondForm },
  { path: 'client/bond-form/:id/edit', component: BondForm },
  { path: 'client/bond/detail/:id', component: BondDetail },
  { path: 'investor/bond/detail/:id', component: BondDetailInvestor },
  { path: 'investor/portfolio', component: PortfolioInvestor },
  { path: 'investor/profile', component: ProfileInvestor },
  { path: 'client/profile', component: ProfilePage },
  { path: 'client/configuration', component: ConfigurationPage },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
