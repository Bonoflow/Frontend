import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SignupClient } from './signup-client';

describe('SignupClient', () => {
  let component: SignupClient;
  let fixture: ComponentFixture<SignupClient>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SignupClient]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SignupClient);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
