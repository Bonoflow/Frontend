import {AfterViewInit, ChangeDetectorRef, Component, OnInit, ViewChild} from '@angular/core';
import {BondModel} from '../../model/bond.model';
import {CashflowModel} from '../../model/cashflow.model';
import {FinancialMetricModel} from '../../model/finanlcial-metric.model';
import {ActivatedRoute, Router} from '@angular/router';
import {BondService} from '../../service/bond.service';
import {CashFlowService} from '../../service/cashflow.service';
import {FinancialMetricService} from '../../service/financial-metric.service';
import {MatTableDataSource} from '@angular/material/table';
import {MatPaginator} from '@angular/material/paginator';
import {InvestmentService} from '../../service/investment.service';
import {InvestorService} from '../../../users/services/investor.service';
import {MatDialog} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import {ConfirmDialog} from '../../../public/components/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-bond-detail-investor',
  standalone: false,
  templateUrl: './bond-detail-investor.html',
  styleUrl: './bond-detail-investor.css'
})
export class BondDetailInvestor implements OnInit, AfterViewInit {
  bond: BondModel | null = null;
  cashFlows: CashflowModel[] = [];
  metrics: FinancialMetricModel | null = null;
  isLoading = true;
  hasInvested = false;
  investorId: number | null = null;
  displayedColumns: string[] = ['period','date','initialBalance','interest','amortization','installment','expenses','fixedInstallment','finalBalance'];
  cashFlowsDataSource = new MatTableDataSource<CashflowModel>();
  @ViewChild(MatPaginator, { static: false }) paginator!: MatPaginator;
  selectedTabIndex = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private bondService: BondService,
    private cashFlowService: CashFlowService,
    private financialMetricService: FinancialMetricService,
    private investmentService: InvestmentService,
    private investorService: InvestorService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.investorId = this.investorService.getInvestorId();
    this.route.params.subscribe(params => {
      const bondId = +params['id'];
      if (bondId) {
        this.loadBond(bondId);
        this.checkInvestment(bondId);
      }
    });
  }

  ngAfterViewInit() {
    this.setupPaginator();
  }

  private setupPaginator(): void {
    if (this.paginator) {
      this.cashFlowsDataSource.paginator = this.paginator;
      this.cdr.detectChanges();
    } else {
      setTimeout(() => this.setupPaginator(), 100);
    }
  }

  onTabChange(index: number): void {
    this.selectedTabIndex = index;
    if (index === 0) {
      setTimeout(() => this.setupPaginator(), 50);
    }
  }

  loadBond(bondId: number): void {
    this.isLoading = true;
    this.bondService.getOne(bondId).subscribe({
      next: (bond: BondModel) => {
        this.bond = bond;
        this.financialMetricService.getByBondId(bondId).subscribe({
          next: (metrics: FinancialMetricModel) => {
            this.metrics = metrics;
            this.cashFlowService.getAll().subscribe({
              next: (flows: CashflowModel[]) => {
                this.cashFlows = flows
                  .filter((f: CashflowModel) => f.bondId === bondId)
                  .sort((a, b) => (a.period ?? 0) - (b.period ?? 0));
                this.cashFlowsDataSource.data = this.cashFlows;
                setTimeout(() => this.setupPaginator(), 100);
                this.isLoading = false;
              },
              error: () => {
                this.isLoading = false;
              }
            });
          },
          error: () => {
            this.isLoading = false;
          }
        });
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  checkInvestment(bondId: number): void {
    if (!this.investorId) return;
    this.investmentService.getAllByInvestorId(this.investorId).subscribe({
      next: (investments) => {
        this.hasInvested = investments.some(inv => inv.bondId === bondId);
      }
    });
  }

  investInBond(): void {
    if (!this.investorId || !this.bond?.id) return;
    const dialogRef = this.dialog.open(ConfirmDialog, {
      data: {
        title: '¿Deseas invertir en este bono?',
        message: 'Pon aceptar si deseas invertir en este bono.',
        placeholder: 'Monto',
      }
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        const investment = {
          investorId: this.investorId!,
          bondId: this.bond!.id!,
          amount: 0,
          investmentDate: new Date().toISOString()
        };
        this.investmentService.create(investment).subscribe({
          next: () => {
            this.snackBar.open('¡Inversión realizada con éxito!', 'Cerrar', { duration: 3000 });
            this.hasInvested = true;
          },
          error: (err) => this.snackBar.open('Error al invertir: ' + (err?.error || 'Intenta nuevamente.'), 'Cerrar', { duration: 4000 })
        });
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/investor/bonds']);
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

  getPaymentFrequencyLabel(frequency: string): string {
    switch (frequency) {
      case 'MONTHLY': return 'Mensual';
      case 'BIMONTHLY': return 'Bimestral';
      case 'QUARTERLY': return 'Trimestral';
      case 'SEMIANNUAL': return 'Semestral';
      case 'ANNUAL': return 'Anual';
      case 'DAILY': return 'Diaria';
      default: return frequency;
    }
  }

  getGraceTypeLabel(graceType: string): string {
    switch (graceType) {
      case 'NO_GRACE': return 'Sin gracia';
      case 'PARTIAL': return 'Parcial';
      case 'TOTAL': return 'Total';
      default: return graceType;
    }
  }

  getCompoundingLabel(compounding: string): string {
    switch (compounding) {
      case 'MONTHLY': return 'Mensual';
      case 'BIMONTHLY': return 'Bimestral';
      case 'QUARTERLY': return 'Trimestral';
      case 'SEMIANNUAL': return 'Semestral';
      case 'ANNUAL': return 'Anual';
      case 'DAILY': return 'Diaria';
      default: return compounding;
    }
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('es-PE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(date));
  }

  formatPercent(value: number): string {
    return `${value.toFixed(2)}%`;
  }
}
