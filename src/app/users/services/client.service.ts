import { Injectable } from '@angular/core';
import { BaseService } from '../../shared/services/base.service';
import { ClientModel } from '../models/client.model';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { catchError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ClientService extends BaseService<ClientModel> {
  constructor(http: HttpClient) {
    super(http);
    this.extraUrl = environment.clientURL;
  }


  setClientId(clientId: number) {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('client_id', clientId.toString());
    }
  }

  getClientId(): number | null {
    if (typeof window !== 'undefined' && window.localStorage) {
      const clientId = localStorage.getItem('client_id');
      return clientId ? parseInt(clientId, 10) : null;
    }
    return null;
  }

  getClientByUserId(userId: number) {
    this.setToken();
    return this.http.get<ClientModel>(`${this.buildPath()}/${userId}/user`, this.httpOptions)
      .pipe(catchError(this.handleError));
  }
}
