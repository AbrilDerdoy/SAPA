import { TestBed } from '@angular/core/testing';

import { FollowRequestService } from './follow-request.service';

describe('FollowRequestService', () => {
  let service: FollowRequestService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FollowRequestService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
