import { Component } from '@angular/core';
import {Router} from '@angular/router';

@Component({
  selector: 'app-signup-role',
  standalone: false,
  templateUrl: './signup-role.html',
  styleUrl: './signup-role.css'
})
export class SignupRole {

  constructor(public router: Router) {
  }

  goToInvestorRegister() {
    this.router.navigate(['/sign-up/investor']);
  }

  goToClientRegister() {
    this.router.navigate(['/sign-up/client']);
  }

  goBack() {
    this.router.navigate(['/']);
  }

}
