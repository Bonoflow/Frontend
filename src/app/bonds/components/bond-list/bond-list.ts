import {Component, OnInit} from '@angular/core';
import {Observable, map} from 'rxjs';
import {BondModel} from '../../model/bond.model';
import {BondService} from '../../service/bond.service';
import {Router} from '@angular/router';
import {ClientService} from '../../../users/services/client.service';
import {MatDialog} from '@angular/material/dialog';
import {ConfirmDialog} from '../../../public/components/confirm-dialog/confirm-dialog';

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
    private clientService: ClientService,
    private dialog: MatDialog,
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
    console.log("Navigating to bond detail with ID:", bondId);
    this.router.navigate(['/client/bond/detail', bondId]);
  }

  createNewBond(): void {
    this.router.navigate(["/client/bond-form"])
  }

  deleteBond(bondId: number): void {
    const dialogRef = this.dialog.open(ConfirmDialog, {
      data: {
        title: 'Eliminar bono',
        message: '¿Estás seguro de que deseas eliminar este bono? Esta acción no se puede deshacer.'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.bondService.delete(bondId).subscribe({
          next: () => {
            this.loadBonds(); // Recarga la lista de bonos
          },
          error: (error) => {
            console.error("Error al eliminar el bono:", error);
            if (error.status === 404) {
              // Manejo opcional: mostrar mensaje en UI si lo deseas
            } else if (error.status === 401 || error.status === 403) {
              // Manejo opcional: mostrar mensaje en UI si lo deseas
            } else {
              // Manejo opcional: mostrar mensaje en UI si lo deseas
            }
          }
        });
      }
    });
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
      case "NO_GRACE":
        return "Sin gracia"
      case "PARTIAL":
        return "Parcial"
      case "TOTAL":
        return "Total"
      default:
        return graceType
    }
  }

  getRateTypeLabel(rateType: string): string {
    return rateType === "EFFECTIVE" ? "Efectiva" : "Nominal"
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
}
