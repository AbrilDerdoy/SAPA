import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PostAttachments } from './post-attachments';

describe('PostAttachments', () => {
  let component: PostAttachments;
  let fixture: ComponentFixture<PostAttachments>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PostAttachments],
    }).compileComponents();

    fixture = TestBed.createComponent(PostAttachments);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
