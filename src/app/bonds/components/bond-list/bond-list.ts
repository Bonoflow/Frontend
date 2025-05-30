import {Component, OnInit} from '@angular/core';
import {Observable, map} from 'rxjs';
import {BondModel} from '../../model/bond.model';
import {BondService} from '../../service/bond.service';
import {Router} from '@angular/router';
import {ClientService} from '../../../users/services/client.service';

@Component({
  selector: 'app-bond-list',
  standalone: false,
  templateUrl: './bond-list.html',
  styleUrl: './bond-list.css'
})
export class BondList implements OnInit {

  bonds$: Observable<BondModel[]>
  isLoading = true
  clientId: number | null

  constructor(
    private bondService: BondService,
    private router: Router,
    private clientService: ClientService
  ) {
    this.clientId = this.clientService.getClientId();
    this.bonds$ = this.bondService.getAll().pipe(
      map(bonds => bonds.filter(bond => bond.clientId === this.clientId))
    );
  }

  ngOnInit(): void {
    this.loadBonds()
  }

  loadBonds(): void {
    this.isLoading = true
    this.bondService.getAll().subscribe({
      next: (bonds) => {
        this.isLoading = false
      },
      error: (error) => {
        this.isLoading = false
        console.error("Error loading bonds:", error)
      },
    })
  }

  viewBondDetail(bondId: number): void {
    this.router.navigate(['/client/bond/detail', bondId]);
  }

  createNewBond(): void {
    this.router.navigate(["/client/bond-form"])
  }

  formatCurrency(amount: number, currency: string): string {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount)
  }

  getGraceTypeLabel(graceType: string): string {
    switch (graceType) {
      case "no_grace":
        return "Sin gracia"
      case "partial":
        return "Parcial"
      case "total":
        return "Total"
      default:
        return graceType
    }
  }

  getRateTypeLabel(rateType: string): string {
    return rateType === "effective" ? "Efectiva" : "Nominal"
  }

  getPaymentFrequencyLabel(frequency: string): string {
    switch (frequency) {
      case "monthly":
        return "Mensual"
      case "bimonthly":
        return "Bimestral"
      case "quarterly":
        return "Trimestral"
      case "semiannual":
        return "Semestral"
      case "annual":
        return "Anual"
      default:
        return frequency
    }
  }
}
