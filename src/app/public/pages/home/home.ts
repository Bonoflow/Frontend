import {Component, OnInit} from '@angular/core';
import {finalize, map, Observable, of, tap} from 'rxjs';
import {BondModel} from '../../../bonds/model/bond.model';
import {BondService} from '../../../bonds/service/bond.service';
import {Router} from '@angular/router';
import {ClientService} from '../../../users/services/client.service';
import {UserApiService} from '../../../users/services/user.service';
import {ProfileService} from '../../../users/services/profile.service';

@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit {

  bonds$: Observable<BondModel[]> = of([]);
  isLoading = true
  firstName = ""
  clientId: number | null = null;

  quickActions = [
    {
      title: "Crear Nuevo Bono",
      description: "Registra un nuevo bono financiero con el método francés",
      icon: "add",
      action: () => this.router.navigate(["client/bond-form"]),
      color: "bg-blue-500",
    },
    {
      title: "Ver Mis Bonos",
      description: "Consulta todos tus bonos registrados",
      icon: "list",
      action: () => this.router.navigate(["client/bonds"]),
      color: "bg-green-500",
    },
  ]

  features = [
    {
      title: "Método Francés",
      description: "Cálculo automático de cuotas constantes con amortización variable",
      icon: "🧮",
    },
    {
      title: "Períodos de Gracia",
      description: "Soporte para gracia total, parcial o sin gracia",
      icon: "⏰",
    },
    {
      title: "Múltiples Monedas",
      description: "Gestiona bonos en Soles, Dólares y Euros",
      icon: "💱",
    },
    {
      title: "Métricas Financieras",
      description: "TCEA, TREA, duración, convexidad y precio de mercado",
      icon: "📊",
    },
    {
      title: "Frecuencias Flexibles",
      description: "Pagos mensuales, bimestrales, trimestrales, semestrales o anuales",
      icon: "📅",
    },
  ]

  constructor(
    private bondService: BondService,
    private clientService: ClientService,
    private userService: UserApiService,
    private profileService: ProfileService,
    private router: Router,
  ) {
  }

  ngOnInit(): void {
    this.loadData();
    this.loadBonds();
  }

  loadBonds(): void {
    this.isLoading = true;
    this.clientId = this.clientService.getClientId();
    this.bonds$ = this.bondService.getAll().pipe(
      map(bonds => bonds.filter(bond => bond.clientId === this.clientId)),
      finalize(() => this.isLoading = false)
    );
  }

  loadData(): void {
    this.isLoading = true;
    const userId = this.userService.getUserId();
    this.profileService.getProfileByUserId(userId).subscribe({
      next: (currentUser) => {
        if (currentUser) {
          this.firstName = currentUser.firstName;
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        console.error("Error al obtener el perfil:", error);
      }
    });
  }

  formatCurrency(amount: number, currency = "PEN"): string {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }




}
