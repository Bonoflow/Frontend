import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BondForm } from './bond-form';

describe('BondForm', () => {
  let component: BondForm;
  let fixture: ComponentFixture<BondForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BondForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BondForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
