import {Component, OnInit} from '@angular/core';
import {UserApiService} from './users/services/user.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  standalone: false,
  styleUrl: './app.css'
})
export class App {
  protected title = 'Bonoflow';
  showSidenav = false;

  constructor(private userApi: UserApiService) {
    this.userApi.isLogged$.subscribe(isLogged => {
      this.showSidenav = isLogged;
    });
  }

}
