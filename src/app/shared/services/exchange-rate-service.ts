// src/app/shared/services/exchange-rate-service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ExchangeRateService {
  private apiUrl = 'https://api.exchangeratesapi.io/latest';
  private accessKey = 'cb8581810b431d4943e74ca0d7ce8e18'; // Reemplaza con tu clave

  constructor(private http: HttpClient) {}

  getRate(from: string, to: string): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}?access_key=${this.accessKey}&base=${from}&symbols=${to}`
    );
  }
}
