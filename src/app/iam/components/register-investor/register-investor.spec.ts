import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegisterInvestor } from './register-investor';

describe('RegisterInvestor', () => {
  let component: RegisterInvestor;
  let fixture: ComponentFixture<RegisterInvestor>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RegisterInvestor]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegisterInvestor);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
