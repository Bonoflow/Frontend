import {AfterViewInit, ChangeDetectorRef, Component, OnInit, ViewChild} from '@angular/core';
import {BondModel} from '../../model/bond.model';
import {CashflowModel} from '../../model/cashflow.model';
import {FinancialMetricModel} from '../../model/finanlcial-metric.model';
import {ActivatedRoute, Router} from '@angular/router';
import {BondService} from '../../service/bond.service';
import {CashFlowService} from '../../service/cashflow.service';
import {FinancialMetricService} from '../../service/financial-metric.service';
import {forkJoin} from 'rxjs';
import {MatTableDataSource} from '@angular/material/table';
import {MatPaginator} from '@angular/material/paginator';
import {BondCalculatorService} from '../../../utils/bond-calcultations';
import {MatDialog} from '@angular/material/dialog';
import {ConfirmDialog} from '../../../public/components/confirm-dialog/confirm-dialog';


@Component({
  selector: 'app-bond-detail',
  standalone: false,
  templateUrl: './bond-detail.html',
  styleUrl: './bond-detail.css'
})

export class BondDetail implements OnInit, AfterViewInit {

  bond: BondModel | null = null;
  cashFlows: CashflowModel[] = [];
  metrics: FinancialMetricModel | null = null;
  isLoading = true;
  isCalculating = false;
  activeTab = "cash-flow";
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
    private cdr: ChangeDetectorRef,
    private bondCalculatorService: BondCalculatorService,
    private dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      const bondId = +params["id"];
      if (bondId) {
        this.loadBondData(bondId);
        console.log("Bond ID from route params:", bondId);
      } else {
        console.log("No se encontro el ID del bono en los parámetros de la ruta.");
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

  deleteBond() {
    const dialogRef = this.dialog.open(ConfirmDialog, {
      data: {
        title: 'Eliminar bono',
        message: '¿Está seguro que desea eliminar este bono? Esta acción no se puede deshacer.'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && this.bond) {
        this.bondService.delete(this.bond.id).subscribe({
          next: () => {
            this.router.navigate(['/client/bonds']);
          },
          error: (error) => {
            console.error('Error al eliminar el bono:', error);
          }
        });
      }
    });
  }

  onTabChange(index: number): void {
    this.selectedTabIndex = index;
    if (index === 0) {
      this.activeTab = 'cash-flow';
      setTimeout(() => {
        this.setupPaginator();
      }, 50);
    } else if (index === 1) {
      this.activeTab = 'metrics';
    }
  }

  loadBondData(bondId: number): void {
    this.isLoading = true;
    this.bondService.getOne(bondId).subscribe({
      next: (bond: BondModel) => {
        if (bond) {
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
                  setTimeout(() => {
                    this.setupPaginator();
                  }, 100);
                  this.isLoading = false;
                },
                error: () => {
                  this.calculateAndSaveCashFlow();
                  console.log("PR1");
                }
              });
            },
            error: () => {
              this.calculateAndSaveCashFlow();
              console.log("PR2");
            }
          });
        } else {
          this.router.navigate(["client/bonds"]);
        }
      },
      error: () => {
        this.isLoading = false;
        console.error("Error al cargar el bono con ID:", bondId);
      }
    });
  }

  calculateAndSaveCashFlow(): void {

    console.log("Calculando :", this.bond);

    if (!this.bond) return;
    const flows = this.bondCalculatorService.calculateCashFlowsOnly(this.bond);
    this.cashFlows = flows;
    this.cashFlowsDataSource.data = this.cashFlows;
    setTimeout(() => this.setupPaginator(), 100);

    if (flows && flows.length > 0) {
      forkJoin(flows.map((flow: CashflowModel) => this.cashFlowService.create(flow))).subscribe({
        next: () => {
          this.isLoading = false;
          this.calculateAndSaveMetrics(); // Llama aquí después de guardar los flujos
        },
        error: () => {
          this.isLoading = false;
        }
      });
    } else {
      this.isLoading = false;
    }
  }

  calculateAndSaveMetrics(): void {
    if (!this.bond || !this.cashFlows.length) return;
    const metrics = this.bondCalculatorService.calculateMetricsOnly(this.bond, this.cashFlows);
    this.metrics = metrics;
    const result = this.financialMetricService.create(metrics);
    if (result.subscribe) {
      result.subscribe({
        next: () => {
          this.isCalculating = false;
        },
        error: () => {
          this.isCalculating = false;
        }
      });
    } else {
      this.isCalculating = false;
    }
  }

  editBond(): void {
    if (this.bond) {
      this.router.navigate(["/client/bond-form", this.bond.id, "edit"]);
    }
  }

  goBack(): void {
    this.router.navigate(["/client/bonds"]);
  }

  formatCurrency(amount: number, currency: string): string {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  }

  getGraceTypeLabel(graceType: string): string {
    switch (graceType) {
      case 'NO_GRACE': return 'Sin gracia';
      case 'PARTIAL': return 'Parcial';
      case 'TOTAL': return 'Total';
      default: return graceType;
    }
  }

  getPaymentFrequencyLabel(frequency: string): string {
    switch (frequency) {
      case "MONTHLY":
        return "Mensual";
      case "BIMONTHLY":
        return "Bimestral";
      case "QUARTERLY":
        return "Trimestral";
      case "SEMIANNUAL":
        return "Semestral";
      case "ANNUAL":
        return "Anual";
      case "DAILY":
        return "Diaria";
      default:
        return frequency;
    }
  }

  getCompoundingLabel(compounding: string): string {
    switch (compounding) {
      case "MONTHLY":
        return "Mensual";
      case "BIMONTHLY":
        return "Bimestral";
      case "QUARTERLY":
        return "Trimestral";
      case "SEMIANNUAL":
        return "Semestral";
      case "ANNUAL":
        return "Anual";
      case "DAILY":
        return "Diaria";
      default:
        return compounding;
    }
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat("es-PE", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(date));
  }

  formatPercent(value: number): string {
    return `${value.toFixed(2)}%`;
  }
}
