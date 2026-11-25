import { TestBed } from '@angular/core/testing';

import { roleGuard } from './role-guard';

describe('roleGuard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should create a guard for the given roles', () => {
    const guard = roleGuard(['PATIENT']);

    expect(typeof guard).toBe('function');
  });
});
