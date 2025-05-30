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
}
