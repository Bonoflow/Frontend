import { Injectable } from '@angular/core';
import { BaseService } from '../../shared/services/base.service';
import { CashflowModel } from '../model/cashflow.model';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { catchError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CashFlowService extends BaseService<CashflowModel> {
  constructor(http: HttpClient) {
    super(http);
    this.extraUrl = environment.cashFlowURL;
  }


  getAllByBondId(bondId: number) {
    this.setToken();
    return this.http.get<CashflowModel[]>(`${this.buildPath()}/bond/${bondId}`, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  getAllByClientId(clientId: number) {
    this.setToken();
    return this.http.get<CashflowModel[]>(`${this.buildPath()}/client/${clientId}`, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

}
