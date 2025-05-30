import { TestBed } from '@angular/core/testing';

import { AuthenticationApiServiceService } from './authentication-api.service';

describe('AuthenticationApiServiceService', () => {
  let service: AuthenticationApiServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthenticationApiServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
