import { Injectable } from '@angular/core';
import { BaseService } from '../../shared/services/base.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import {FinancialMetricModel} from '../model/finanlcial-metric.model';
import {catchError} from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class FinancialMetricService extends BaseService<FinancialMetricModel> {
  constructor(http: HttpClient) {
    super(http);
    this.extraUrl = environment.financialMetricURL;
  }

  getByBondId(bondId: number) {
    this.setToken();
    return this.http.get<FinancialMetricModel>(`${this.buildPath()}/bond/${bondId}`, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

}
