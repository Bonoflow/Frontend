import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import {AuthenticationApiService} from '../../services/authentication-api.service';
import {UserApiService} from '../../../users/services/user.service';
import {ClientService} from '../../../users/services/client.service';



@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  standalone: false,
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  loginAttempts: number = 0;
  errorMessage: string | null = null;
  hidePassword: boolean = true;

  togglePasswordVisibility(): void {
    this.hidePassword = !this.hidePassword;
  }

  constructor(
    private formBuilder: FormBuilder,
    private authenticationApiService: AuthenticationApiService,
    private userApiService: UserApiService,
    private clientService: ClientService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });

    if (this.userApiService.isLogged()) {
      this.redirectUser();
    }
  }

  login(): void {
    if (this.loginAttempts > 3) {
      this.errorMessage = 'Has alcanzado el límite de intentos de inicio de sesión. Por favor, inténtalo más tarde.';
      return;
    }

    this.loginAttempts++;

    const { email, password } = this.loginForm.value;

    this.authenticationApiService.signIn(email, password).subscribe(
      (response: any) => {
        this.userApiService.setLogged(true);
        this.userApiService.setUserId(response['id']);
        this.snackBar.open('Inicio de sesión exitoso 🤗', 'Cerrar', { duration: 2000 });
        this.clientService.getAll().subscribe((data: any[]) => {
          const client = data.find((client) => client.userId === response['id']);
          if (client) {
            if (client.id !== undefined) {
              this.clientService.setClientId(client.id);
            }
            this.router.navigateByUrl('/client/home');
          } else {
            this.snackBar.open('No se encontró un perfil de cliente asociado.', 'Cerrar', { duration: 3000 });
          }
        });
      },
      (error) => {
        this.snackBar.open('Error. Credenciales no encontradas 😥', 'Cerrar', { duration: 3000 });
      }
    );
  }

  public redirectSignUp(): void {
    this.router.navigateByUrl('/sign-up/client');
  }

  private redirectUser(): void {
    this.router.navigateByUrl('/client/home');
  }
}
