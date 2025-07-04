import { Component } from '@angular/core';
import {finalize, forkJoin, map, Observable, of, switchMap} from 'rxjs';
import { ProfileService } from '../../../users/services/profile.service';
import { InvestorService } from '../../../users/services/investor.service';
import { UserApiService } from '../../../users/services/user.service';
import {InvestmentService} from '../../../bonds/service/investment.service';
import {InvestmentModel} from '../../../bonds/model/investment.model';
import {BondService} from '../../../bonds/service/bond.service';
import {BondModel} from '../../../bonds/model/bond.model';
import {Router} from '@angular/router';

@Component({
  selector: 'app-home-investor',
  standalone: false,
  templateUrl: './home-investor.html',
  styleUrl: '../home/home.css'
})
export class HomeInvestor {
  firstName = '';
  isLoading = false;
  investorId: number | null = null;

  // Simulación de bonos
  bonds$: Observable<any[]> = of([]);

  quickActions = [
    {
      icon: 'add_circle',
      title: 'Invertir en un bono',
      description: 'Busca y selecciona bonos para invertir.',
      action: () => { this.goToBonds()}
    },
    {
      icon: 'account_balance_wallet',
      title: 'Mi portafolio',
      description: 'Revisa el estado de tu portafolio de bonos.',
      action: () => { this.goToPortfolio() }
    }
  ];

  constructor(
    private profileService: ProfileService,
    private investorService: InvestorService,
    private userService: UserApiService,
    private investmentService: InvestmentService,
    private router: Router,
    private bondService: BondService // Asumiendo que BondService es similar a InvestmentService
  ) {
    this.loadData();
    this.loadBonds();
  }

  goToBonds(){
    this.router.navigate(['/investor/bonds']);
  }

  goToBondDetail(bondId: number) {
    this.router.navigate(['/investor/bond/detail/', bondId]);
  }

  goToPortfolio(){
    this.router.navigate(['/investor/portfolio']);
  }

  loadBonds(): void {
    this.isLoading = true;
    this.investorId = this.investorService.getInvestorId();
    if (this.investorId !== null) {
      this.investmentService.getAllByInvestorId(this.investorId).pipe(
        map((investments: InvestmentModel[]) => Array.from(new Set(investments.map(inv => inv.bondId)))),
        // Trae los bonos usando forkJoin
        switchMap((bondIds: number[]) => {
          if (bondIds.length === 0) return of([]);
          return forkJoin(bondIds.map(id => this.bondService.getOne(id)));
        }),
        finalize(() => this.isLoading = false)
      ).subscribe({
        next: (bonds: BondModel[]) => {
          this.bonds$ = of(bonds);
        },
        error: () => {
          this.bonds$ = of([]);
          this.isLoading = false;
        }
      });
    } else {
      this.isLoading = false;
    }
  }

  loadData(): void {
    this.isLoading = true;
    const userId = this.userService.getUserId();
    this.profileService.getProfileByUserId(userId).subscribe({
      next: (currentUser: any) => {
        if (currentUser) {
          this.firstName = currentUser.firstName ?? '';
        }
        this.isLoading = false;
      },
      error: (error: any) => {
        this.isLoading = false;
        console.error('Error al obtener el perfil:', error);
      }
    });
  }

  formatCurrency(value: number, currency: string): string {
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: currency || 'PEN' }).format(value);
  }
}
