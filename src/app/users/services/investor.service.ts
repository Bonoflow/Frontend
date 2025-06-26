import { Injectable } from '@angular/core';
import { BaseService } from '../../shared/services/base.service';
import { InvestorModel } from '../models/investor.model';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { catchError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class InvestorService extends BaseService<InvestorModel> {
  constructor(http: HttpClient) {
    super(http);
    this.extraUrl = environment.investorURL;
  }

  // Ejemplo de método personalizado
  getInvestorByUserId(userId: number) {
    this.setToken();
    return this.http.get<InvestorModel>(`${this.buildPath()}/${userId}/user`, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  setInvestorId(investorId: number) {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('investor_id', investorId.toString());
    }
  }

  getInvestorId(): number | null {
    if (typeof window !== 'undefined' && window.localStorage) {
      const investorId = localStorage.getItem('investor_id');
      return investorId ? parseInt(investorId, 10) : null;
    }
    return null;
  }
}
