import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BondPageInvestor } from './bond-page-investor';

describe('BondPageInvestor', () => {
  let component: BondPageInvestor;
  let fixture: ComponentFixture<BondPageInvestor>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BondPageInvestor]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BondPageInvestor);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
