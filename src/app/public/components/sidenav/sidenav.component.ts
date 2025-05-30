import {Component, Input, ViewChild} from '@angular/core';
import {UserApiService} from '../../../users/services/user.service';
import {MatDrawer} from '@angular/material/sidenav';
import {ClientService} from '../../../users/services/client.service';


@Component({
  selector: 'app-sidenav',
  standalone: false,
  templateUrl: './sidenav.component.html',
  styleUrl: './sidenav.component.css'
})
export class SidenavComponent {

  isOpen = false;
  @ViewChild('drawer') drawer!: MatDrawer;

  onToggleSidenav(isOpen: boolean) {
    isOpen ? this.drawer.open() : this.drawer.close();
  }

  getIconForButton(button: string): string {
    const icons: {[key: string]: string} = {
      'Inicio': 'home',
      'Bono': 'card_giftcard',
      'Perfil': 'person',

    };
    return icons[button] || 'help';
  }

  @Input() isDoctor: boolean;

  constructor(private userApiService: UserApiService,
              private clientService: ClientService) {

    this.isDoctor = this.userApiService.getIsDoctor();
  }

  getSidebarButtons(): string[] {
    return ["Inicio","Bono","Perfil"];
  }

  getButtonRoute(button: string): string {
    const clientRoutes: { [key: string]: string } = {
      "Inicio": "client/home",
      "Perfil": "client/profile",
      "Bono": "client/bonds",
    };
    return clientRoutes[button] || "/";
  }

  logOut() {
    this.userApiService.setLogged(false);
    this.userApiService.setUserId(0);
    this.userApiService.clearToken();
    this.clientService.setClientId(0);
    this.onToggleSidenav(false);
    this.isOpen = false;
  }

  isLogged(){
    return this.userApiService.isLogged();
  }
}
