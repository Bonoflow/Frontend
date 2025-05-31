import {Component, OnInit} from '@angular/core';
import {map, Observable} from 'rxjs';
import {BondModel} from '../../model/bond.model';
import {BondService} from '../../service/bond.service';
import {Router} from '@angular/router';
import {AuthenticationApiService} from '../../../iam/services/authentication-api.service';
import {UserApiService} from '../../../users/services/user.service';
import {ProfileService} from '../../../users/services/profile.service';
import {ClientService} from '../../../users/services/client.service';

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit{

  bonds$: Observable<BondModel[]>
  isLoading = true
  username = ""

  constructor(
    private bondService: BondService,
    private profileService: ProfileService,
    private clientService: ClientService,
    private userService: UserApiService,
    private router: Router,
  ) {
    let clientId = this.clientService.getClientId();
    this.bonds$ = this.bondService.getAll().pipe(
      map(bonds => bonds.filter(bond => bond.clientId === clientId))
    );
  }

  ngOnInit(): void {
    const userId = this.userService.getUserId();
    this.profileService.getProfileByUserId(userId).subscribe({
      next: (profile) => {
        this.username = profile.firstName + " " + profile.lastName;
      },
      error: () => {
        this.username = "";
      }
    });

    this.loadBonds();
  }

  loadBonds(): void {
    this.isLoading = true
    this.bondService.getAll().subscribe({
      next: () => {
        this.isLoading = false
      },
      error: (error) => {
        this.isLoading = false
        console.error("Error loading bonds:", error)
      },
    })
  }

  viewBondDetail(bondId: number): void {
    this.router.navigate(["/bonds", bondId])
  }

  view() {

  }

  createNewBond(): void {
    this.router.navigate(["/bonds/new"])
  }

  formatCurrency(amount: number, currency: string): string {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount)
  }

}
