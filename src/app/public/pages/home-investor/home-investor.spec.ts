import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HomeInvestor } from './home-investor';

describe('HomeInvestor', () => {
  let component: HomeInvestor;
  let fixture: ComponentFixture<HomeInvestor>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [HomeInvestor]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HomeInvestor);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
