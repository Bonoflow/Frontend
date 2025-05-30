import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BondList } from './bond-list';

describe('BondList', () => {
  let component: BondList;
  let fixture: ComponentFixture<BondList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BondList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BondList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
