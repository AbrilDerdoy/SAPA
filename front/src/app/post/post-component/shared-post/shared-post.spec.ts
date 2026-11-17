import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SharedPost } from './shared-post';

describe('SharedPost', () => {
  let component: SharedPost;
  let fixture: ComponentFixture<SharedPost>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharedPost],
    }).compileComponents();

    fixture = TestBed.createComponent(SharedPost);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
