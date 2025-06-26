import {Component, Input, OnDestroy, ViewChild} from '@angular/core';
import {UserApiService} from '../../../users/services/user.service';
import {MatDrawer} from '@angular/material/sidenav';
import {ClientService} from '../../../users/services/client.service';
import {InvestorService} from '../../../users/services/investor.service';
import {Subscription} from 'rxjs';


@Component({
  selector: 'app-sidenav',
  standalone: false,
  templateUrl: './sidenav.component.html',
  styleUrl: './sidenav.component.css'
})
export class SidenavComponent implements OnDestroy {

  isOpen = false;
  private userSub: Subscription;
  @ViewChild('drawer') drawer!: MatDrawer;

  onToggleSidenav(isOpen: boolean) {
    isOpen ? this.drawer.open() : this.drawer.close();
  }

  ngOnDestroy() {
    this.userSub.unsubscribe();
  }

  getIconForButton(button: string): string {
    const icons: {[key: string]: string} = {
      'Inicio': 'home',
      'Bonos': 'card_giftcard',
      'Perfil': 'person',
      'Configuración': 'settings',
      'Portafolio': 'account_balance_wallet',

    };
    return icons[button] || 'help';
  }

  @Input() isInvestor: boolean;

  constructor(private userApiService: UserApiService,
              private clientService: ClientService,
              private investorService: InvestorService) {

    this.isInvestor = this.userApiService.getIsInvestor()
    this.userSub = this.userApiService.isInvestor$.subscribe(val => {
      this.isInvestor = val;
    });
  }

  getSidebarButtons(): string[] {
    return this.isInvestor
      ? ["Inicio", "Bonos", "Portafolio", "Perfil", ]
      : ["Inicio", "Bonos", "Perfil", "Configuración"];
  }

  getButtonRoute(button: string): string {

    const clientRoutes: { [key: string]: string } = {
      "Inicio": "client/home",
      "Perfil": "client/profile",
      "Bonos": "client/bonds",
      "Configuración": "client/configuration",
    };
    const investorRoutes: { [key: string]: string } = {
      "Inicio": "investor/home",
      "Perfil": "investor/profile",
      "Bonos": "investor/bonds",
      "Portafolio": "investor/portfolio",
    };
    const routes = this.isInvestor ? investorRoutes : clientRoutes;
    return routes[button] || "/";
  }

  logOut() {
    this.userApiService.setLogged(false);
    this.userApiService.setUserId(0);
    this.userApiService.clearToken();
    this.clientService.setClientId(0);
    this.investorService.setInvestorId(0);
    this.onToggleSidenav(false);
    this.isOpen = false;
  }

  isLogged(){
    return this.userApiService.isLogged();
  }
}
