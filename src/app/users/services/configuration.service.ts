// src/app/users/services/configuration.service.ts
import { Injectable } from '@angular/core';
import { BaseService } from '../../shared/services/base.service';
import { ConfigurationModel } from '../models/configuration.model';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { catchError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ConfigurationService extends BaseService<ConfigurationModel> {
  constructor(http: HttpClient) {
    super(http);
    this.extraUrl = environment.configurationURL;
  }

  getConfigurationByUserId(userId: number) {
    this.setToken();
    return this.http.get<ConfigurationModel>(`${this.buildPath()}/${userId}/user`, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

}
