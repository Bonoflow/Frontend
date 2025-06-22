import { Injectable } from '@angular/core';
import { BaseService } from '../../shared/services/base.service';
import { BondModel } from '../model/bond.model';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BondService extends BaseService<BondModel> {
  constructor(http: HttpClient) {
    super(http);
    this.extraUrl = environment.bondURL;
  }


}
