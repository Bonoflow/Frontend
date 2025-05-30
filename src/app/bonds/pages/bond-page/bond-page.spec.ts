import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BondPage } from './bond-page';

describe('BondPage', () => {
  let component: BondPage;
  let fixture: ComponentFixture<BondPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BondPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BondPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
