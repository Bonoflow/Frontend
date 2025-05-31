import {Component, OnInit} from '@angular/core';
import {BondModel} from '../../model/bond.model';
import {CashflowModel} from '../../model/cashflow.model';
import {FinancialMetricModel} from '../../model/finanlcial-metric.model';
import {ActivatedRoute, Router} from '@angular/router';
import {BondService} from '../../service/bond.service';
import {CashFlowService} from '../../service/cashflow.service';
import {FinancialMetricService} from '../../service/financial-metric.service';
import {forkJoin} from 'rxjs';


@Component({
  selector: 'app-bond-detail',
  standalone: false,
  templateUrl: './bond-detail.html',
  styleUrl: './bond-detail.css'
})
export class BondDetail implements OnInit {

  bond: BondModel | null = null
  cashFlows: CashflowModel[] = []
  metrics: FinancialMetricModel | null = null
  isLoading = true
  isCalculating = false
  activeTab = "cash-flow"

  selectedTabIndex = 0;

  onTabChange(index: number): void {
    this.selectedTabIndex = index;
    this.activeTab = index === 0 ? 'cash-flow' : 'metrics';
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private bondService: BondService,
    private cashFlowService: CashFlowService,
    private financialMetricService: FinancialMetricService
  ) {}



  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      const bondId = +params["id"]
      if (bondId) {
        this.loadBondData(bondId)
      }
      console.log("Bond ID from route params:", bondId);
    })
  }

  loadBondData(bondId: number): void {
    this.isLoading = true;
    this.bondService.getOne(bondId).subscribe({
      next: (bond) => {
        if (bond) {
          this.bond = bond;
          // Primero intenta obtener métricas y cashflows guardados
          this.financialMetricService.getOne(bondId).subscribe({
            next: (metrics) => {
              this.metrics = metrics;
              console.log("Se encontraron metricas guardadas");
              this.cashFlowService.getAll().subscribe({
                next: (flows) => {
                  // Filtra y ordena los cashflows por bondId y período
                  console.log("Se encontraron cashflows guardadas");
                  this.cashFlows = flows
                    .filter(f => f.bondId === bondId)
                    .sort((a, b) => (a.period ?? 0) - (b.period ?? 0));
                  this.isLoading = false;
                },
                error: () => {
                  // Si no existen, calcula y opcionalmente guarda
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
    this.bondService.calculateCashFlow(this.bond).subscribe({
      next: (flows) => {
        this.cashFlows = flows;
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

  calculateAndSaveMetrics(): void {
    if (!this.bond) return;
    this.bondService.calculateFinancialMetrics(this.bond).subscribe({
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

  exportCashFlow(): void {
    // En una aplicación real, aquí se implementaría la exportación
    alert("Funcionalidad de exportación en desarrollo")
  }

  editBond(): void {
    if (this.bond) {
      this.router.navigate(["/bonds", this.bond.id, "edit"])
    }
  } // Rutas

  goBack(): void {
    this.router.navigate(["/client/bonds"]);
  } // Rutas

  formatCurrency(amount: number, currency: string): string {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount)
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat("es-PE", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(date))
  }

  formatPercent(value: number): string {
    return `${value.toFixed(2)}%`
  }
}
