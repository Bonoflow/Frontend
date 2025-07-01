import { Injectable } from '@angular/core';
import { BaseService } from '../../shared/services/base.service';
import { BondModel } from '../model/bond.model';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import {Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BondService extends BaseService<BondModel> {
  constructor(http: HttpClient) {
    super(http);
    this.extraUrl = environment.bondURL;
  }

  getAllByClientId(clientId: number): Observable<BondModel[]> {
    return this.http.get<BondModel[]>(`${this.extraUrl}/client/${clientId}`);
  }
}
