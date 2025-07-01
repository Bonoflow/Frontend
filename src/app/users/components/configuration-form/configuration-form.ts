import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { ConfigurationService } from '../../services/configuration.service';
import { ConfigurationModel } from '../../models/configuration.model';
import { ExchangeRateService } from '../../../shared/services/exchange-rate-service';
import { UserApiService } from '../../services/user.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CashflowModel } from '../../../bonds/model/cashflow.model';
import { ClientService } from '../../services/client.service';
import { CashFlowService } from '../../../bonds/service/cashflow.service';
import {catchError, forkJoin, Observable, switchMap} from 'rxjs';
import {BondCalculatorService} from '../../../utils/bond-calcultations';
import {BondService} from '../../../bonds/service/bond.service';
import {FinancialMetricService} from '../../../bonds/service/financial-metric.service';

@Component({
  selector: 'app-configuration-form',
  standalone: false,
  templateUrl: './configuration-form.html',
  styleUrl: './configuration-form.css'
})
export class ConfigurationForm implements OnInit {
  form: FormGroup;
  configuration?: ConfigurationModel;

  currency = [
    { value: 'PEN', label: 'Soles' },
    { value: 'USD', label: 'Dólares' }
  ];

  rateTypes = [
    { value: 'EFFECTIVE', label: 'Efectiva' },
    { value: 'NOMINAL', label: 'Nominal' }
  ];

  compoundings = [
    { value: 'DAILY', label: 'Diaria' },
    { value: 'MONTHLY', label: 'Mensual' },
    { value: 'BIMONTHLY', label: 'Bimestral' },
    { value: 'QUARTERLY', label: 'Trimestral' },
    { value: 'SEMIANNUAL', label: 'Semestral' },
    { value: 'ANNUAL', label: 'Anual' }
  ];

  currencyOriginal: string = '';
  cashflowsOriginal: CashflowModel[] = [];
  exchangeRate: number = 1;

  constructor(
    private fb: FormBuilder,
    private configurationService: ConfigurationService,
    private userService: UserApiService,
    private snackBar: MatSnackBar,
    private exchangeRateService: ExchangeRateService,
    private clientService: ClientService,
    private cashFlowService: CashFlowService,
    private bondCalculator: BondCalculatorService,
    private bondService: BondService,
    private financialMetricService: FinancialMetricService
  ) {
    this.form = this.fb.group({
      currency: ['', Validators.required],
      rateType: ['', Validators.required],
      compounding: [{ value: '', disabled: true }]
    }, {
      validators: this.compoundingRequiredIfNominal
    });
  }

  ngOnInit() {
    // Cargar configuración del usuario
    const userId = this.userService.getUserId();
    this.configurationService.getConfigurationByUserId(userId).subscribe(config => {
      this.configuration = config;
      this.currencyOriginal = config.currency;
      console.log(this.currencyOriginal);
      this.form.patchValue(config);
      this.toggleCompounding(this.form.get('rateType')?.value);

      this.clientService.getClientByUserId(userId).subscribe(client => {
        if (client && client.id) {
          this.cashFlowService.getAllByClientId(client.id).subscribe(data => {
            this.cashflowsOriginal = data;
            console.log(data);
          });
        }
      });

    });

    // Suscribirse a cambios en el formulario
    this.form.get('rateType')?.valueChanges.subscribe(value => {
      this.toggleCompounding(value);
      this.form.get('compounding')?.updateValueAndValidity();
    });

    // Actualizar tasa de cambio al cambiar la moneda
    this.form.get('currency')?.valueChanges.subscribe(value => {
      if (value) {
        this.updateExchangeRate(value);
      }
    });
  }


  updateExchangeRate(currencyTarget: string) {
    if (this.currencyOriginal === currencyTarget) {
      this.exchangeRate = 1;
      return;
    }
    this.exchangeRateService.getRate('EUR', 'USD,PEN').subscribe({
      next: data => {
        if (!data?.rates) {
          // Valor por defecto: 1 USD = 3.7 PEN
          this.exchangeRate = (this.currencyOriginal === 'PEN' && currencyTarget === 'USD') ? 1 / 3.7 :
            (this.currencyOriginal === 'USD' && currencyTarget === 'PEN') ? 3.7 : 1;
          console.log("Tasa por defecto: ", this.exchangeRate);
          return;
        }
        const usd = data.rates['USD'];
        const pen = data.rates['PEN'];
        if (usd && pen) {
          const usdToPen = pen / usd;
          this.exchangeRate = (this.currencyOriginal === 'PEN' && currencyTarget === 'USD') ? 1 / usdToPen :
            (this.currencyOriginal === 'USD' && currencyTarget === 'PEN') ? usdToPen : 1;
          console.log(`Tipo de cambio actualizado: ${this.exchangeRate}`);
        }
      },
      error: err => {
        this.exchangeRate = (this.currencyOriginal === 'PEN' && currencyTarget === 'USD') ? 1 / 3.7 :
          (this.currencyOriginal === 'USD' && currencyTarget === 'PEN') ? 3.7 : 1;
        console.error('Error al obtener tasa de cambio, usando valor por defecto', err);
      }
    });
  }

  toggleCompounding(rateType: string) {
    const compoundingControl = this.form.get('compounding');
    if (rateType === 'EFFECTIVE') {
      compoundingControl?.disable();
      compoundingControl?.setValue('');
    } else {
      compoundingControl?.enable();
    }
  }

  compoundingRequiredIfNominal(group: AbstractControl) {
    const rateType = group.get('rateType')?.value;
    const compounding = group.get('compounding')?.value;
    if (rateType === 'NOMINAL' && !compounding) {
      group.get('compounding')?.setErrors({ required: true });
      return { compoundingRequired: true };
    }
    return null;
  }

  onSubmit() {
    if (this.form.valid && this.configuration && this.configuration.id) {
      const updated = { ...this.configuration, ...this.form.value };
      this.configurationService.update(this.configuration.id, updated).subscribe({
        next: () => {
          const newCurrency = this.form.get('currency')?.value;
          const exchangeRate = this.exchangeRate;

          // Agrupar cashflows por bondId
          const bondGroups: { [bondId: number]: CashflowModel[] } = {};
          this.cashflowsOriginal.forEach(cf => {
            if (!bondGroups[cf.bondId]) bondGroups[cf.bondId] = [];
            bondGroups[cf.bondId].push(cf);
          });

          const updateObservables: Observable<any>[] = [];

          Object.entries(bondGroups).forEach(([bondId]) => {
            updateObservables.push(
              this.bondService.getOne(bondId).pipe(
                switchMap(bond => {
                  // Solo convertir si la moneda cambia
                  let updatedBond = { ...bond, currency: newCurrency };
                  console.log("Actualizando bono: ", bondId, " de ", bond.currency, " a ", newCurrency);
                  if (bond.currency !== newCurrency) {
                    // Usa 3.7 como tasa fija si no tienes una dinámica correcta
                    const rate = 3.7;
                    if (this.currencyOriginal === 'PEN' && newCurrency === 'USD') {
                      // PEN a USD: dividir
                      console.log("Dividiendo valores de PEN a USD");
                      updatedBond.faceValue = Number((bond.faceValue / rate).toFixed(2));
                      updatedBond.issuanceExpenses = Number(((bond.issuanceExpenses || 0) / rate).toFixed(2));
                      updatedBond.placementExpenses = Number(((bond.placementExpenses || 0) / rate).toFixed(2));
                      updatedBond.structuringExpenses = Number(((bond.structuringExpenses || 0) / rate).toFixed(2));
                      updatedBond.cavaliExpenses = Number(((bond.cavaliExpenses || 0) / rate).toFixed(2));
                      console.log("Valor Nominal Actualizado: ", updatedBond.faceValue);
                    } else if (this.currencyOriginal === 'USD' && newCurrency === 'PEN') {
                      // USD a PEN: multiplicar
                      console.log("Multiplicando valores de USD a PEN");
                      updatedBond.faceValue = Number((bond.faceValue * rate).toFixed(2));
                      updatedBond.issuanceExpenses = Number(((bond.issuanceExpenses || 0) * rate).toFixed(2));
                      updatedBond.placementExpenses = Number(((bond.placementExpenses || 0) * rate).toFixed(2));
                      updatedBond.structuringExpenses = Number(((bond.structuringExpenses || 0) * rate).toFixed(2));
                      updatedBond.cavaliExpenses = Number(((bond.cavaliExpenses || 0) * rate).toFixed(2));
                      console.log("Valor Nominal Actualizado: ", updatedBond.faceValue);
                    }
                  }
                  return this.bondService.update(bondId, updatedBond).pipe(
                    switchMap(() => {
                      const newCashflows = this.bondCalculator.calculateCashFlowsOnly({ ...updatedBond });
                      return forkJoin(newCashflows.map(cf => this.cashFlowService.create(cf))).pipe(
                        switchMap((createdCashflows) => {
                          const metrics = this.bondCalculator.calculateMetricsOnly({ ...updatedBond }, createdCashflows as CashflowModel[]);
                          return this.financialMetricService.create(metrics);
                        })
                      );
                    })
                  );
                })
              )
            );
          });

          forkJoin(updateObservables).subscribe({
            next: () => {
              this.snackBar.open('Configuración, bonos, cashflows y métricas actualizados correctamente 🎉', 'Cerrar', { duration: 3000 });
              this.currencyOriginal = newCurrency;
            },
            error: () => {
              this.snackBar.open('Error al actualizar cashflows, bonos o métricas 😥', 'Cerrar', { duration: 3000 });
            }
          });
        },
        error: () => {
          this.snackBar.open('Ocurrió un error al actualizar la configuración 😥', 'Cerrar', { duration: 3000 });
        }
      });
    }
  }
}
