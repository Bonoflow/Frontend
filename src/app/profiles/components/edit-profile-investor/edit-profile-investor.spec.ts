import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditProfileInvestor } from './edit-profile-investor';

describe('EditProfileInvestor', () => {
  let component: EditProfileInvestor;
  let fixture: ComponentFixture<EditProfileInvestor>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EditProfileInvestor]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditProfileInvestor);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
