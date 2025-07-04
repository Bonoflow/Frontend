import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Profile } from '../../../users/models/profile.model';
import {ProfileService} from '../../../users/services/profile.service';
import {UserApiService} from '../../../users/services/user.service';
import {StorageService} from '../../../shared/services/storage.service';
import {MatSnackBar} from '@angular/material/snack-bar';

@Component({
  selector: 'app-edit-profile',
  standalone: false,
  templateUrl: './edit-profile.html',
  styleUrl: './edit-profile.css'
})
export class EditProfile implements OnInit {
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
      description: [''],
      photo: [''],
      company: ['', Validators.required],
      ruc: ['', [Validators.required, Validators.pattern('^[0-9]{11}$')]],
    });
  }


  ngOnInit(): void {
    let userId = this.userService.getUserId();
    console.log(userId);
    this.profileService.getProfileByUserId(userId).subscribe((profile: Profile) => {
      if (profile) {
        console.log("Profile found:", profile);
        this.profileId = profile.id;
        this.profileForm.patchValue({
          description: profile.description,
          photo: profile.photo || '',
          company: profile.company || '',
          ruc: profile.ruc || ''
        });
        this.originalProfileData = {
          description: profile.description,
          photo: profile.photo || '',
          company: profile.company || '',
          ruc: profile.ruc || ''
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
        firstName: 'noname',
        lastName: 'no_lastname',
        birthDate: new Date('1990-01-01'),  // Assuming you want to set a default value
        description: this.profileForm.value.description,
        photo: this.profileForm.value.photo || '',
        userId: userId,
        company: this.profileForm.value.company || '',
        ruc: this.profileForm.value.ruc || ''
      };
      console.log(profileToUpdate);
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
