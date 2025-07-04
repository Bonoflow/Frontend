import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BondService } from '../../service/bond.service';
import { ActivatedRoute, Router } from '@angular/router';
import { BondModel } from '../../model/bond.model';
import { ClientService } from '../../../users/services/client.service';
import { ConfigurationService } from '../../../users/services/configuration.service';
import {BondCalculatorService} from '../../../utils/bond-calcultations';
import {MatSnackBar} from '@angular/material/snack-bar';

@Component({
  selector: 'app-bond-form',
  standalone: false,
  templateUrl: './bond-form.html',
  styleUrl: './bond-form.css'
})
export class BondForm implements OnInit {
  bondForm: FormGroup;
  isLoading = false;
  isEditMode = false;
  bondId?: number;
  configuration: any;

  currencies = [
    { value: "PEN", label: "Soles (PEN)" },
    { value: "USD", label: "Dólares (USD)" },
    { value: "EUR", label: "Euros (EUR)" },
  ];

  rateTypes = [
    { value: "EFFECTIVE", label: "Efectiva" },
    { value: "NOMINAL", label: "Nominal" },
  ];

  capitalizations = [
    { value: "DAILY", label: "Diaria" },
    { value: "MONTHLY", label: "Mensual" },
    { value: "BIMONTHLY", label: "Bimestral" },
    { value: "QUARTERLY", label: "Trimestral" },
    { value: "SEMIANNUAL", label: "Semestral" },
    { value: "ANNUAL", label: "Anual" },
  ];

  paymentFrequencies = [
    { value: "MONTHLY", label: "Mensual" },
    { value: "BIMONTHLY", label: "Bimestral" },
    { value: "QUARTERLY", label: "Trimestral" },
    { value: "SEMIANNUAL", label: "Semestral" },
    { value: "ANNUAL", label: "Anual" },
  ];

  graceTypes = [
    { value: "NO_GRACE", label: "Sin gracia" },
    { value: "PARTIAL", label: "Parcial" },
    { value: "TOTAL", label: "Total" },
  ];

  constructor(
    private fb: FormBuilder,
    private bondService: BondService,
    private router: Router,
    private route: ActivatedRoute,
    private clientService: ClientService,
    private configurationService: ConfigurationService,
    private bondCalculatorService: BondCalculatorService,
    private snackBar: MatSnackBar,
  ) {
    this.bondForm = this.fb.group({
      name: ["", [Validators.required, Validators.minLength(3)]],
      nominal_value: [0, [Validators.required, Validators.min(1)]],
      currency: ["PEN", [Validators.required]],
      interest_rate: [0, [Validators.required, Validators.min(0.01)]],
      rate_type: ["", [Validators.required]],
      capitalization: ["", [Validators.required]],
      payment_frequency: ["", [Validators.required]],
      grace_type: ["NO_GRACE", [Validators.required]],
      grace_period: [0, [Validators.required, Validators.min(0)]],
      issue_date: [null, [Validators.required]],
      maturity_date: [null, [Validators.required]],
      market_rate: [0, [Validators.required]],
      issuance_expenses: [{ value: 0, disabled: true }],
      placement_expenses: [{ value: 0, disabled: true }],
      structuring_expenses: [{ value: 0, disabled: true }],
      cavali_expenses: [{ value: 0, disabled: true }],
    });
  }

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      if (params["id"]) {
        this.isEditMode = true;
        this.bondId = +params["id"];
        this.loadBond();
      }
    });

    // Cargar configuración y setear valores por defecto solo si NO es edit mode
    const clientId = this.clientService.getClientId();
    if (clientId && !this.isEditMode) {
      this.configurationService.getConfigurationByUserId(clientId).subscribe({
        next: (config) => {
          console.log("Configuracion encontrada:", config);
          this.configuration = config;
          if (config) {
            this.bondForm.patchValue({
              currency: config.currency || "PEN",
              rate_type: config.rateType || "EFFECTIVE",
              capitalization: config.compounding || "MONTHLY",
            });
          }
        }
      });
    }

    // Mostrar/ocultar capitalización según el tipo de tasa
    this.bondForm.get("rate_type")?.valueChanges.subscribe((value) => {
      const capitalizationControl = this.bondForm.get("capitalization");
      if (value === "NOMINAL") {
        capitalizationControl?.setValidators([Validators.required]);
      } else {
        capitalizationControl?.clearValidators();
      }
      capitalizationControl?.updateValueAndValidity();
    });

    // Calcular gastos automáticamente al cambiar el valor nominal
    this.bondForm.get('nominal_value')?.valueChanges.subscribe((nominal) => {
      const n = Number(nominal) || 0;
      // Ajusta los porcentajes según tu lógica de negocio
      const issuance = +(n * 0.01).toFixed(2);      // 1%
      const placement = +(n * 0.005).toFixed(2);     // 0.5%
      const structuring = +(n * 0.003).toFixed(2);   // 0.3%
      const cavali = +(n * 0.002).toFixed(2);        // 0.2%
      this.bondForm.patchValue({
        issuance_expenses: issuance,
        placement_expenses: placement,
        structuring_expenses: structuring,
        cavali_expenses: cavali,
      }, { emitEvent: false });
    });
  }

  loadBond(): void {
    if (this.bondId) {
      this.bondService.getOne(this.bondId).subscribe({
        next: (bond) => {
          if (bond) {
            this.bondForm.patchValue({
              name: bond.name,
              nominal_value: bond.faceValue,
              currency: bond.currency,
              interest_rate: bond.interestRate,
              rate_type: bond.rateType,
              capitalization: bond.compounding,
              payment_frequency: bond.paymentFrequency,
              grace_type: bond.graceType,
              grace_period: bond.gracePeriod,
              issue_date: bond.issueDate,
              maturity_date: bond.maturityDate,
              issuance_expenses: bond.issuanceExpenses || 0,
              placement_expenses: bond.placementExpenses || 0,
              structuring_expenses: bond.structuringExpenses || 0,
              cavali_expenses: bond.cavaliExpenses || 0,
              market_rate: bond.marketRate || 0,
            });
          }
        },
        error: () => {
          this.router.navigate(["/bonds"]);
        },
      });
    }
  }

  onSubmit(): void {
    if (this.bondForm.valid) {
      this.isLoading = true;

      const clientId = this.clientService.getClientId();
      if (clientId == null) {
        this.isLoading = false;
        return;
      }
      const form = this.bondForm.getRawValue();

      // Calcular maturity_date si no se ingresó manualmente
      let maturityDate = form.maturity_date;
      if (!maturityDate && form.issue_date && form.term) {
        const issue = new Date(form.issue_date);
        issue.setMonth(issue.getMonth() + Number(form.term));
        maturityDate = issue.toISOString().split('T')[0];
      }

      const bondData: BondModel = {
        name: form.name,
        faceValue: form.nominal_value,
        currency: form.currency,
        interestRate: form.interest_rate,
        rateType: form.rate_type,
        compounding: form.capitalization,
        paymentFrequency: form.payment_frequency,
        graceType: form.grace_type,
        gracePeriod: form.grace_period,
        clientId: clientId,
        issueDate: form.issue_date,
        maturityDate: maturityDate,
        issuanceExpenses: form.issuance_expenses,
        placementExpenses: form.placement_expenses,
        structuringExpenses: form.structuring_expenses,
        cavaliExpenses: form.cavali_expenses,
        marketRate: form.market_rate,
      };

      console.log(bondData);

      try {
        this.bondCalculatorService.validateBond(bondData);
      } catch (error) {
        this.isLoading = false;
        this.snackBar.open(
          error instanceof Error ? error.message : String(error),
          'Cerrar',
          { duration: 5000, panelClass: ['snackbar-error'] }
        );
        return;
      }

      const operation =
        this.isEditMode && this.bondId
          ? this.bondService.update(this.bondId, bondData)
          : this.bondService.create(bondData);

      operation.subscribe({
        next: (result: any) => {
          this.isLoading = false;
          if (result) {
            this.router.navigate(["/client/bond/detail", result.id || this.bondId]);
          }
        },
        error: () => {
          this.isLoading = false;
        },
      });
    }
  }

  onCancel(): void {
    window.history.back();
  }

  get showCapitalization(): boolean {
    return this.bondForm.get("rate_type")?.value === "NOMINAL";
  }

  // Getters para validación
  get name() { return this.bondForm.get("name"); }
  get nominal_value() { return this.bondForm.get("nominal_value"); }
  get interest_rate() { return this.bondForm.get("interest_rate"); }
  get term() { return this.bondForm.get("term"); }
  get grace_period() { return this.bondForm.get("grace_period"); }

  get nameTouched() { return this.name?.touched; }
  get nameInvalid() { return this.name?.invalid; }

  get nominalValueTouched() { return this.nominal_value?.touched; }
  get nominalValueInvalid() { return this.nominal_value?.invalid; }

  get interestRateTouched() { return this.interest_rate?.touched; }
  get interestRateInvalid() { return this.interest_rate?.invalid; }

  get termTouched() { return this.term?.touched; }
  get termInvalid() { return this.term?.invalid; }

  get gracePeriodTouched() { return this.grace_period?.touched; }
  get gracePeriodInvalid() { return this.grace_period?.invalid; }
}
