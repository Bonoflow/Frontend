import { Component, OnInit } from '@angular/core';
import { Observable, of, catchError, map, switchMap } from 'rxjs';
import { InvestmentService } from '../../service/investment.service';
import { InvestorService } from '../../../users/services/investor.service';
import { BondService } from '../../service/bond.service';
import { InvestmentModel } from '../../model/investment.model';
import { BondModel } from '../../model/bond.model';
import { Router } from '@angular/router';

interface InvestmentWithBond extends InvestmentModel {
  bond: BondModel;
}

@Component({
  selector: 'app-portfolio-investor',
  standalone: false,
  templateUrl: './portfolio-investor.html',
  styleUrl: './portfolio-investor.css'
})
export class PortfolioInvestor implements OnInit {
  investments$: Observable<InvestmentWithBond[]>;
  isLoading = true;
  investorId: number | null = null;

  constructor(
    private investmentService: InvestmentService,
    private investorService: InvestorService,
    private bondService: BondService,
    private router: Router
  ) {
    this.investments$ = of([]);
    this.investorId = this.investorService.getInvestorId();
  }

  ngOnInit(): void {
    this.loadInvestments();
  }

  loadInvestments(): void {
    this.isLoading = true;
    const investorId = this.investorService.getInvestorId();
    if (!investorId) {
      this.investments$ = of([]);
      this.isLoading = false;
      return;
    }

    this.investments$ = this.investmentService.getAllByInvestorId(investorId).pipe(
      catchError(() => of([])),
      switchMap((investments: InvestmentModel[]) => {
        if (!investments.length) return of([]);
        return this.bondService.getAll().pipe(
          map((bonds: BondModel[]) =>
            investments.map(inv => ({
              ...inv,
              bond: bonds.find(b => b.id === inv.bondId)!
            })).filter(inv => !!inv.bond)
          )
        );
      }),
      catchError(error => {
        console.error('Error al cargar portafolio:', error);
        return of([]);
      })
    );

    this.investments$.subscribe(() => {
      this.isLoading = false;
    });
  }

  viewBondDetail(bondId: number): void {
    this.router.navigate(['/investor/bond/detail', bondId]);
  }

  formatCurrency(amount: number, currency: string): string {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  }

  getRateTypeLabel(rateType: string): string {
    return rateType === 'EFFECTIVE' ? 'Efectiva' : 'Nominal';
  }
}
