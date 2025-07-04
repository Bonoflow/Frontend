import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SignupInvestor } from './signup-investor';

describe('SignupInvestor', () => {
  let component: SignupInvestor;
  let fixture: ComponentFixture<SignupInvestor>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SignupInvestor]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SignupInvestor);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
