import { Component } from '@angular/core';
import {ClientModel} from '../../../users/models/client.model';
import {Profile} from '../../../users/models/profile.model';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {UserApiService} from '../../../users/services/user.service';
import {ClientService} from '../../../users/services/client.service';
import {AuthenticationApiService} from '../../services/authentication-api.service';
import {ProfileService} from '../../../users/services/profile.service';
import {MatSnackBar} from '@angular/material/snack-bar';
import {StorageService} from '../../../shared/services/storage.service';
import {Router} from '@angular/router';

@Component({
  selector: 'app-register-client',
  standalone: false,
  templateUrl: './register-client.html',
  styleUrl: './register-client.css'
})
export class RegisterClient {
  hidePassword = true;
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  registerForm: FormGroup = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(8)]),
    company: new FormControl('', [Validators.required]),
    ruc: new FormControl('', [Validators.required, Validators.minLength(11), Validators.maxLength(11)]),
    photo: new FormControl('xd', [Validators.required]),
    description: new FormControl(''),
  });

  photo_d: string | null = null;

  constructor(
    private userApiService: UserApiService,
    private clientService: ClientService,
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
      ['ROLE_USER', 'ROLE_CLIENT']
    ).subscribe(() => {
      this.authenticationApiService.signIn(
        this.registerForm.value.email,
        this.registerForm.value.password
      ).subscribe((response: any) => {
        const userId = response['id'];
        this.userApiService.setUserId(userId);
        this.userApiService.setLogged(true);

        const clientProfile = new Profile(
          'noname', // firstName
          'no_lastname', // lastName
          new Date('1990-01-01'), // birthDate
          userId, // userId
          this.registerForm.value.description, // description
          this.photo_d ?? '', // photo
          this.registerForm.value.company, // company
          this.registerForm.value.ruc // ruc
        );

        console.log(clientProfile);

        this.profileService.create(clientProfile).subscribe(
          (profileResponse: any) => {
            this.clientService.getClientByUserId(userId).subscribe(
              (client: ClientModel) => {
                if (client.id !== undefined) {
                  this.clientService.setClientId(client.id);
                  this.userApiService.setIsInvestor(false);
                  this.snackBar.open('Bienvenido ' + clientProfile.firstName + ' 🤗', 'Cerrar', { duration: 2000 });
                  this.router.navigateByUrl('/client/home');
                }
              },
              () => {
                this.snackBar.open('Error al obtener el perfil del cliente.', 'Cerrar', { duration: 3000, panelClass: ['error-snackbar'] });
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
