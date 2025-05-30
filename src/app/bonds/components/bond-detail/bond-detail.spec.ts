import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BondDetail } from './bond-detail';

describe('BondDetail', () => {
  let component: BondDetail;
  let fixture: ComponentFixture<BondDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BondDetail]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BondDetail);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
