import {Component, EventEmitter, Output} from '@angular/core';
import {UserApiService} from '../../../users/services/user.service';

@Component({
  selector: 'app-header',
  standalone: false,
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  isOpen = false;

  @Output() toggleSidenav = new EventEmitter<boolean>();

  constructor(private userApiService: UserApiService) {
  }

  toggleDrawer() {
    this.isOpen = !this.isOpen;
    this.toggleSidenav.emit(this.isOpen);
  }

  isLogged(){
    return this.userApiService.isLogged();
  }
}
