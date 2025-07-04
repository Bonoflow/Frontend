import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PortfolioInvestor } from './portfolio-investor';

describe('PortfolioInvestor', () => {
  let component: PortfolioInvestor;
  let fixture: ComponentFixture<PortfolioInvestor>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PortfolioInvestor]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PortfolioInvestor);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
