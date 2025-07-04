import { Injectable } from '@angular/core';
import { BaseService } from '../../shared/services/base.service';
import { InvestmentModel } from '../model/investment.model';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { catchError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class InvestmentService extends BaseService<InvestmentModel> {
  constructor(http: HttpClient) {
    super(http);
    this.extraUrl = environment.investmentURL;
  }

  getAllByInvestorId(investorId: number) {
    this.setToken();
    return this.http.get<InvestmentModel[]>(`${this.buildPath()}/investor/${investorId}`, this.httpOptions)
      .pipe(catchError(this.handleError));
  }
}
