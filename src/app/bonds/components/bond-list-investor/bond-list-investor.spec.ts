import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BondListInversor } from './bond-list-investor';

describe('BondListInversor', () => {
  let component: BondListInversor;
  let fixture: ComponentFixture<BondListInversor>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BondListInversor]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BondListInversor);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
