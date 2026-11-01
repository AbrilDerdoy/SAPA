import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FollowRequest } from './follow-requests';

describe('FollowRequest', () => {
  let component: FollowRequest;
  let fixture: ComponentFixture<FollowRequest>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FollowRequest],
    }).compileComponents();

    fixture = TestBed.createComponent(FollowRequest);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
