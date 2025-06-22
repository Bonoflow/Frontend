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
import {MatProgressSpinner} from '@angular/material/progress-spinner';

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
  displayedColumns: string[] = ['period','date','initialBalance','interest','amortization','installment','finalBalance'];
  cashFlowsDataSource = new MatTableDataSource<any>();

  // Cambia el ViewChild para ser más específico
  @ViewChild(MatPaginator, { static: false }) paginator!: MatPaginator;

  selectedTabIndex = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private bondService: BondService,
    private cashFlowService: CashFlowService,
    private financialMetricService: FinancialMetricService,
    private cdr: ChangeDetectorRef,
    private bondCalculatorService: BondCalculatorService
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
      console.log('Paginator disponible en setupPaginator');
      this.cashFlowsDataSource.paginator = this.paginator;

      // Forzar detección de cambios
      this.cdr.detectChanges();

      console.log('Paginator configurado:');
      console.log('- Length:', this.cashFlowsDataSource.data.length);
      console.log('- Page Size:', this.paginator.pageSize);
      console.log('- Page Index:', this.paginator.pageIndex);
    } else {
      console.log('Paginator no disponible en setupPaginator');
      // Reintentar después de un breve delay
      setTimeout(() => this.setupPaginator(), 100);
    }
  }

  onTabChange(index: number): void {
    this.selectedTabIndex = index;
    if (index === 0) {
      this.activeTab = 'cash-flow';
      // Reconfigurar paginator cuando se cambia al tab de cash flow
      setTimeout(() => {
        this.setupPaginator();
      }, 50);
    } else if (index === 1) {
      this.activeTab = 'metrics';
      console.log('Tab cambiado a: Métricas');
    }
  }

  loadBondData(bondId: number): void {
    this.isLoading = true;
    this.bondService.getOne(bondId).subscribe({
      next: (bond) => {
        if (bond) {
          this.bond = bond;
          console.log("Bono cargado:", this.bond);
          this.financialMetricService.getByBondId(bondId).subscribe({
            next: (metrics) => {
              this.metrics = metrics;
              console.log("Se encontraron metricas guardadas");
              this.cashFlowService.getAll().subscribe({
                next: (flows) => {
                  console.log("Se encontraron cashflows guardadas");
                  this.cashFlows = flows
                    .filter(f => f.bondId === bondId)
                    .sort((a, b) => (a.period ?? 0) - (b.period ?? 0));

                  // Actualizar datos del dataSource
                  this.cashFlowsDataSource.data = this.cashFlows;

                  console.log('Datos cargados:', this.cashFlows.length, 'elementos');

                  // Configurar paginator después de cargar datos
                  setTimeout(() => {
                    this.setupPaginator();
                  }, 100);

                  this.isLoading = false;
                },
                error: () => {
                  console.log("No se encontraron cashflows guardadas, calculando nuevas...");
                  this.calculateAndSaveCashFlow();
                }
              });
            },
            error: () => {
              console.log("No se encontraron métricas guardadas, calculando nuevas...");
              this.calculateAndSaveMetrics();
            }
          });
        } else {
          this.router.navigate(["client/bonds"]);
        }
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  calculateAndSaveCashFlow(): void {
    if (!this.bond) return;
    this.bondCalculatorService.calculateCashFlow(this.bond).subscribe({
      next: (flows) => {
        this.cashFlows = flows;
        this.cashFlowsDataSource.data = this.cashFlows;

        console.log('Datos calculados:', this.cashFlows.length, 'elementos');

        // Configurar paginator después de calcular datos
        setTimeout(() => {
          this.setupPaginator();
        }, 100);

        if (flows && flows.length > 0) {
          forkJoin(flows.map(flow => this.cashFlowService.create(flow))).subscribe({
            next: () => {
              this.isLoading = false;
            },
            error: () => {
              this.isLoading = false;
            }
          });
        } else {
          this.isLoading = false;
        }
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  // Resto de métodos sin cambios...
  calculateAndSaveMetrics(): void {
    if (!this.bond) return;
    this.bondCalculatorService.calculateFinancialMetrics(this.bond).subscribe({
      next: (metrics) => {
        this.metrics = metrics;
        this.financialMetricService.create(metrics).subscribe({
          next: () => {
            this.isCalculating = false;
            this.calculateAndSaveCashFlow();
          },
          error: () => {
            this.isCalculating = false;
            this.calculateAndSaveCashFlow();
          }
        });
      },
      error: () => {
        this.isLoading = false;
      }
    });
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
