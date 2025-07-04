import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {ProfileService} from '../../../users/services/profile.service';
import {UserApiService} from '../../../users/services/user.service';
import {StorageService} from '../../../shared/services/storage.service';
import {MatSnackBar} from '@angular/material/snack-bar';
import {Profile} from '../../../users/models/profile.model';

@Component({
  selector: 'app-edit-profile-investor',
  standalone: false,
  templateUrl: './edit-profile-investor.html',
  styleUrl: './edit-profile-investor.css'
})
export class EditProfileInvestor implements OnInit {
  profileForm: FormGroup;
  isLoading = false;
  profileId?: number;
  private originalProfileData: any = null;

  constructor(private fb: FormBuilder,
              private profileService: ProfileService,
              private userService: UserApiService,
              private storageService: StorageService,
              private snackBar: MatSnackBar) {
    this.profileForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      birthDate: ['', Validators.required],
      description: [''],
      photo: [''],
    });
  }


  ngOnInit(): void {
    let userId = this.userService.getUserId();
    this.profileService.getProfileByUserId(userId).subscribe((profile: Profile) => {
      if (profile) {
        console.log("Profile found:", profile);
        this.profileId = profile.id;

        // Convert birthDate to a Date object if it's a string

        this.profileForm.patchValue({
          firstName: profile.firstName,
          lastName: profile.lastName,
          birthDate: profile.birthDate,
          description: profile.description,
          photo: profile.photo || '',

        });

        console.log(profile.birthDate);
        console.log(this.profileForm.value.birthDate);

        this.originalProfileData = {
          firstName: profile.firstName,
          lastName: profile.lastName,
          birthDate: profile.birthDate,
          description: profile.description,
          photo: profile.photo || '',
        };
      }
    });

  }

  async onPhotoSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    this.isLoading = true;
    const reader = new FileReader();
    reader.onload = async (e: any) => {
      const base64 = e.target.result;
      const url = await this.storageService.uploadFile(file.name, base64);
      if (url) {
        this.profileForm.get('photo')?.setValue(url);
      }
      this.isLoading = false;
    };
    reader.readAsDataURL(file);
  }

  onSubmit(): void {
    if (this.profileForm.valid) {
      this.isLoading = true;
      const userId = this.userService.getUserId();
      const profileToUpdate = {
        firstName: this.profileForm.value.firstName,
        lastName: this.profileForm.value.lastName,
        birthDate: this.profileForm.value.birthDate,
        description: this.profileForm.value.description,
        photo: this.profileForm.value.photo || '',
        userId: userId
      };
      this.profileService.update(this.profileId, profileToUpdate).subscribe({
        next: (profile: Profile) => {
          this.isLoading = false;
          this.snackBar.open('Tus cambios se han realizado correctamente 🎉', 'Cerrar', { duration: 3000 });
        },
        error: (error) => {
          this.isLoading = false;
          this.snackBar.open('Ocurrió un error al guardar los cambios 😥', 'Cerrar', { duration: 3000 });
        }
      });
    }
  }

  isProfileChanged(): boolean {
    return JSON.stringify(this.profileForm.value) !== JSON.stringify(this.originalProfileData);
  }
}
