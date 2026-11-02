import { TestBed } from '@angular/core/testing';

import { SavedPostService } from './saved-post-service';

describe('SavedPostService', () => {
  let service: SavedPostService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SavedPostService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
