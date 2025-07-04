import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BondDetailInvestor } from './bond-detail-investor';

describe('BondDetailInvestor', () => {
  let component: BondDetailInvestor;
  let fixture: ComponentFixture<BondDetailInvestor>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BondDetailInvestor]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BondDetailInvestor);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
