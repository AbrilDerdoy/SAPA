import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SavedPost } from './saved-post';

describe('SavedPost', () => {
  let component: SavedPost;
  let fixture: ComponentFixture<SavedPost>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SavedPost],
    }).compileComponents();

    fixture = TestBed.createComponent(SavedPost);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
