import { Component } from '@angular/core';
import { InvestorModel } from '../../../users/models/investor.model';
import { Profile } from '../../../users/models/profile.model';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { UserApiService } from '../../../users/services/user.service';
import { InvestorService } from '../../../users/services/investor.service';
import { AuthenticationApiService } from '../../services/authentication-api.service';
import { ProfileService } from '../../../users/services/profile.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { StorageService } from '../../../shared/services/storage.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register-investor',
  standalone: false,
  templateUrl: './register-investor.html',
  styleUrl: './register-investor.css'
})
export class RegisterInvestor {
  hidePassword = true;
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  registerForm: FormGroup = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(8)]),
    firstname: new FormControl('', [Validators.required]),
    lastname: new FormControl('', [Validators.required]),
    birthDate: new FormControl('', [Validators.required]),
    photo: new FormControl('xd', [Validators.required]),
    description: new FormControl(''),
  });

  photo_d: string | null = null;

  constructor(
    private userApiService: UserApiService,
    private investorService: InvestorService,
    private authenticationApiService: AuthenticationApiService,
    private profileService: ProfileService,
    private snackBar: MatSnackBar,
    private storageService: StorageService,
    private router: Router
  ) {}

  removeImage() {
    this.selectedFile = null;
    this.imagePreview = null;
  }

  onImagePicked(event: any) {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      this.selectedFile = file;
      this.imagePreview = URL.createObjectURL(file);
      const reader = new FileReader();
      const name = "PROFILEPHOTO_IMAGE_" + Date.now();
      reader.readAsDataURL(file);
      reader.onloadend = () => {
        this.storageService.uploadFile(name, reader.result)
          .then((url: string | null) => {
            if (url) {
              this.photo_d = url;
            } else {
              this.snackBar.open('Error al subir la imagen', 'Cerrar', { duration: 2000 });
            }
          })
          .catch(() => {
            this.snackBar.open('Error al subir la imagen', 'Cerrar', { duration: 2000 });
          });
      };
    }
  }

  onSubmit() {
    if (!this.photo_d) {
      this.snackBar.open('Debe seleccionar una foto de perfil 📷', 'Cerrar', { duration: 2000 });
      return;
    }

    this.authenticationApiService.clearToken();

    this.authenticationApiService.signUp(
      this.registerForm.value.email,
      this.registerForm.value.password,
      ['ROLE_USER', 'ROLE_INVESTOR']
    ).subscribe(() => {
      this.authenticationApiService.signIn(
        this.registerForm.value.email,
        this.registerForm.value.password
      ).subscribe((response: any) => {
        const userId = response['id'];
        this.userApiService.setUserId(userId);
        this.userApiService.setLogged(true);

        const investorProfile = new Profile(
          this.registerForm.value.firstname,
          this.registerForm.value.lastname,
          this.registerForm.value.birthDate,
          userId,
          this.registerForm.value.description,
          this.photo_d ?? undefined,
        );

        this.profileService.create(investorProfile).subscribe(
          (profileResponse: any) => {
            this.investorService.getInvestorByUserId(userId).subscribe(
              (investor: InvestorModel) => {
                if (investor.id !== undefined) {
                  this.investorService.setInvestorId(investor.id);
                  this.userApiService.setIsInvestor(true);
                  this.snackBar.open('Bienvenido ' + investorProfile.firstName + ' 🤗', 'Cerrar', { duration: 2000 });
                  this.router.navigateByUrl('/investor/home');
                }
              },
              () => {
                this.snackBar.open('Error al obtener el perfil del inversor.', 'Cerrar', { duration: 3000, panelClass: ['error-snackbar'] });
              }
            );
          },
          () => {
            this.snackBar.open('Error al crear el perfil.', 'Cerrar', { duration: 3000, panelClass: ['error-snackbar'] });
          }
        );
      });
    });
  }

  goBack() {
    window.history.back();
  }
}
