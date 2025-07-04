import { Component, OnInit } from '@angular/core';
import {catchError, Observable, of, switchMap,map} from 'rxjs';
import { BondModel } from '../../model/bond.model';
import { BondService } from '../../service/bond.service';
import { Router } from '@angular/router';
import { InvestmentService } from '../../service/investment.service';
import { InvestorService } from '../../../users/services/investor.service';
import { InvestmentModel } from '../../model/investment.model';
import { MatDialog } from '@angular/material/dialog';
import {ConfirmDialog} from '../../../public/components/confirm-dialog/confirm-dialog';
import {MatSnackBar} from '@angular/material/snack-bar';


@Component({
  selector: 'app-bond-list-investor',
  standalone: false,
  templateUrl: './bond-list-investor.html',
  styleUrl: './bond-list-investor.css'
})
export class InvestorBondList implements OnInit {
  bonds$: Observable<BondModel[]>;
  isLoading = true;
  investorId: number | null = null;

  constructor(
    private bondService: BondService,
    private investmentService: InvestmentService,
    private investorService: InvestorService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.bonds$ = of([]);
    this.investorId = this.investorService.getInvestorId();
  }

  ngOnInit() {
    this.loadBonds();
  }

  investInBond(bondId: number) {

    if (!this.investorId) {
      alert('No se encontró el ID del inversor.');
      return;
    }

    const dialogRef = this.dialog.open(ConfirmDialog, {
      data: {
        title: '¿Deseas tomar este bono?',
        message: 'Pon aceptar si deseas tomar este bono.',
        placeholder: 'Monto',
      }
    });

    dialogRef.afterClosed().subscribe((inputValue: string | null) => {
      if (inputValue) {
        const investment = new InvestmentModel(
          this.investorId!,
          bondId,
          0,
          new Date().toISOString()
        );
        console.log(investment);
        this.investmentService.create(investment).subscribe({
          next: () => {
            this.snackBar.open('¡Inversión realizada con éxito!', 'Cerrar', { duration: 3000 });
            this.loadBonds();
          },
          error: (err) => this.snackBar.open('Error al invertir: ' + (err?.error || 'Intenta nuevamente.'), 'Cerrar', { duration: 4000 })
        });
      }
    });
  }

  loadBonds(): void {
    this.isLoading = true;
    const investorId = this.investorService.getInvestorId();
    if (!investorId) {
      this.bonds$ = of([]);
      this.isLoading = false;
      return;
    }

    this.bonds$ = this.investmentService.getAllByInvestorId(investorId).pipe(
      catchError(() => of([])),
      // inversiones: InvestmentModel[]
      // Ahora obtenemos todos los bonos y filtramos
      switchMap((investments: InvestmentModel[]) => {
        const investedBondIds = investments.map(inv => inv.bondId);
        return this.bondService.getAll().pipe(
          map((bonds: BondModel[]) =>
            bonds.filter(bond => !investedBondIds.includes(bond.id!))
          )
        );
      }),
      catchError(error => {
        console.error("Error al cargar bonos:", error);
        return of([]);
      })
    );

    this.bonds$.subscribe(bonds => {
      console.log('Bonos:', bonds);
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

  getGraceTypeLabel(graceType: string): string {
    switch (graceType) {
      case 'NO_GRACE':
        return 'Sin gracia';
      case 'PARTIAL':
        return 'Parcial';
      case 'TOTAL':
        return 'Total';
      default:
        return graceType;
    }
  }

  getRateTypeLabel(rateType: string): string {
    return rateType === 'EFFECTIVE' ? 'Efectiva' : 'Nominal';
  }

  getPaymentFrequencyLabel(frequency: string): string {
    switch (frequency) {
      case 'MONTHLY':
        return 'Mensual';
      case 'BIMONTHLY':
        return 'Bimestral';
      case 'QUARTERLY':
        return 'Trimestral';
      case 'SEMIANNUAL':
        return 'Semestral';
      case 'ANNUAL':
        return 'Anual';
      default:
        return frequency;
    }
  }
}
