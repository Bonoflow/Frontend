import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegisterClient } from './register-client';

describe('RegisterClient', () => {
  let component: RegisterClient;
  let fixture: ComponentFixture<RegisterClient>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RegisterClient]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegisterClient);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
