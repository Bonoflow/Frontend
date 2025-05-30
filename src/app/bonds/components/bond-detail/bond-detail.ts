import {Component, OnInit} from '@angular/core';
import {BondModel} from '../../model/bond.model';
import {CashflowModel} from '../../model/cashflow.model';
import {FinancialMetricModel} from '../../model/finanlcial-metric.model';
import {ActivatedRoute, Router} from '@angular/router';
import {BondService} from '../../service/bond.service';
import {CashFlowService} from '../../service/cashflow.service';
import {FinancialMetricService} from '../../service/financial-metric.service';


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
          this.bondService.calculateFinancialMetrics(bond).subscribe({
            next: (metrics) => {
              this.metrics = metrics;
              this.calculateCashFlow();
            },
            error: (error) => {
              console.error("Error calculating metrics:", error);
              this.isLoading = false;
            }
          });
        } else {
          this.router.navigate(["/bonds"]);
        }
      },
      error: (error) => {
        console.error("Error loading bond data:", error);
        this.isLoading = false;
      }
    });
  }

  calculateCashFlow(): void {
    if (!this.bond) return

    this.isCalculating = true
    this.bondService.calculateCashFlow(this.bond).subscribe({
      next: (flows) => {
        this.cashFlows = flows
        this.isCalculating = false
        this.isLoading = false
      },
      error: (error) => {
        console.error("Error calculating cash flow:", error)
        this.isCalculating = false
        this.isLoading = false
      },
    })
  }

  recalculateCashFlow(): void {
    if (this.bond) {
      this.calculateCashFlow()
    }
  }

  exportCashFlow(): void {
    // En una aplicación real, aquí se implementaría la exportación
    alert("Funcionalidad de exportación en desarrollo")
  }

  editBond(): void {
    if (this.bond) {
      this.router.navigate(["/bonds", this.bond.id, "edit"])
    }
  }

  goBack(): void {
    window.history.back();
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
    this.selectedTabIndex = tab === 'cash-flow' ? 0 : 1;
  }

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
