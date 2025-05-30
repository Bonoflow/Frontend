import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {BondService} from '../../service/bond.service';
import {ActivatedRoute, Router} from '@angular/router';
import {BondModel} from '../../model/bond.model';
import {ClientService} from '../../../users/services/client.service';

@Component({
  selector: 'app-bond-form',
  standalone: false,
  templateUrl: './bond-form.html',
  styleUrl: './bond-form.css'
})
export class BondForm implements OnInit {
  bondForm: FormGroup
  isLoading = false
  isEditMode = false
  bondId?: number

  currencies = [
    { value: "PEN", label: "Soles (PEN)" },
    { value: "USD", label: "Dólares (USD)" },
    { value: "EUR", label: "Euros (EUR)" },
  ]

  rateTypes = [
    { value: "effective", label: "Efectiva" },
    { value: "nominal", label: "Nominal" },
  ]

  capitalizations = [
    { value: "daily", label: "Diaria" },
    { value: "monthly", label: "Mensual" },
    { value: "bimonthly", label: "Bimestral" },
    { value: "quarterly", label: "Trimestral" },
    { value: "semiannual", label: "Semestral" },
    { value: "annual", label: "Anual" },
  ]

  paymentFrequencies = [
    { value: "monthly", label: "Mensual" },
    { value: "bimonthly", label: "Bimestral" },
    { value: "quarterly", label: "Trimestral" },
    { value: "semiannual", label: "Semestral" },
    { value: "annual", label: "Anual" },
  ]

  graceTypes = [
    { value: "no_grace", label: "Sin gracia" },
    { value: "partial", label: "Parcial" },
    { value: "total", label: "Total" },
  ]

  constructor(
    private fb: FormBuilder,
    private bondService: BondService,
    private router: Router,
    private route: ActivatedRoute,
    private clientService: ClientService
  ) {
    this.bondForm = this.fb.group({
      name: ["", [Validators.required, Validators.minLength(3)]],
      nominal_value: [0, [Validators.required, Validators.min(1)]],
      currency: ["PEN", [Validators.required]],
      interest_rate: [0, [Validators.required, Validators.min(0.01)]],
      rate_type: ["effective", [Validators.required]],
      capitalization: ["monthly"],
      term: [12, [Validators.required, Validators.min(1)]],
      payment_frequency: ["monthly", [Validators.required]],
      grace_type: ["no_grace", [Validators.required]],
      grace_period: [0, [Validators.required, Validators.min(0)]],
    })
  }

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      if (params["id"]) {
        this.isEditMode = true
        this.bondId = +params["id"]
        this.loadBond()
      }
    })

    // Mostrar/ocultar capitalización según el tipo de tasa
    this.bondForm.get("rate_type")?.valueChanges.subscribe((value) => {
      const capitalizationControl = this.bondForm.get("capitalization")
      if (value === "nominal") {
        capitalizationControl?.setValidators([Validators.required])
      } else {
        capitalizationControl?.clearValidators()
      }
      capitalizationControl?.updateValueAndValidity()
    })
  }

  loadBond(): void {
    if (this.bondId) {
      this.bondService.getOne(this.bondId).subscribe({
        next: (bond) => {
          if (bond) {
            this.bondForm.patchValue(bond)
          }
        },
        error: (error) => {
          console.error("Error loading bond:", error)
          this.router.navigate(["/bonds"])
        },
      })
    }
  }

  onSubmit(): void {
    if (this.bondForm.valid) {
      this.isLoading = true;
      const clientId = this.clientService.getClientId();
      if (clientId == null) {
        // Maneja el error, muestra mensaje o redirige
        this.isLoading = false;
        console.error("No se encontró el clientId.");
        return;
      }
      const form = this.bondForm.value;
      const bondData: BondModel = {
        name: form.name,
        faceValue: form.nominal_value,
        currency: form.currency,
        interestRate: form.interest_rate,
        rateType: form.rate_type,
        compounding: form.capitalization,
        term: form.term,
        paymentFrequency: form.payment_frequency,
        graceType: form.grace_type,
        gracePeriod: form.grace_period,
        clientId: clientId
      };

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
        error: (error: any) => {
          this.isLoading = false;
          console.error("Error saving bond:", error);
        },
      });
    }
  }

  onCancel(): void {
    window.history.back();
  }

  get showCapitalization(): boolean {
    return this.bondForm.get("rate_type")?.value === "nominal"
  }

  // Getters para validación
  get name() {
    return this.bondForm.get("name")
  }
  get nominal_value() {
    return this.bondForm.get("nominal_value")
  }
  get interest_rate() {
    return this.bondForm.get("interest_rate")
  }
  get term() {
    return this.bondForm.get("term")
  }
  get grace_period() {
    return this.bondForm.get("grace_period")
  }

  // Agrega estos getters al final de tu clase BondForm

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
