import { TestBed } from '@angular/core/testing';

import { PostCommentService } from './post-comment-service';

describe('PostCommentService', () => {
  let service: PostCommentService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PostCommentService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
