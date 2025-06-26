import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SignupRole } from './signup-role';

describe('SignupRole', () => {
  let component: SignupRole;
  let fixture: ComponentFixture<SignupRole>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SignupRole]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SignupRole);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
