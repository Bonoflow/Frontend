import { TestBed } from '@angular/core/testing';

import { FinancialMetricService } from './financial-metric.service';

describe('FinancialMetricService', () => {
  let service: FinancialMetricService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FinancialMetricService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
