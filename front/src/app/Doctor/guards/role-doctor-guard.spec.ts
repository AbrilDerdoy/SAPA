import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { doctorGuardGuard } from './doctor-guard-guard';

describe('doctorGuardGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => doctorGuardGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
