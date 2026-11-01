import { TestBed } from '@angular/core/testing';

import { MedicationSearchService } from './medication-search.service';

describe('MedicationSearchService', () => {
  let service: MedicationSearchService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MedicationSearchService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
