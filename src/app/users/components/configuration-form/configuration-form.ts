import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { ConfigurationService } from '../../services/configuration.service';
import { ConfigurationModel } from '../../models/configuration.model';
import { UserApiService } from '../../services/user.service';
import { MatSnackBar } from '@angular/material/snack-bar';

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

  constructor(
    private fb: FormBuilder,
    private configurationService: ConfigurationService,
    private userService: UserApiService,
    private snackBar: MatSnackBar
  ) {
    this.form = this.fb.group({
      currency: ['', Validators.required],
      rateType: ['', Validators.required],
      compounding: [{ value: '', disabled: true }]
    }, { validators: this.compoundingRequiredIfNominal });
  }

  ngOnInit() {
    const userId = this.userService.getUserId();
    this.configurationService.getConfigurationByUserId(userId).subscribe(config => {
      this.configuration = config;
      this.form.patchValue(config);
      this.toggleCompounding(this.form.get('rateType')?.value);
    });

    this.form.get('rateType')?.valueChanges.subscribe(value => {
      this.toggleCompounding(value);
      this.form.get('compounding')?.updateValueAndValidity();
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
          this.snackBar.open('Configuración actualizada correctamente 🎉', 'Cerrar', { duration: 3000 });
        },
        error: () => {
          this.snackBar.open('Ocurrió un error al actualizar la configuración 😥', 'Cerrar', { duration: 3000 });
        }
      });
    }
  }
}
