import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FollowRequests } from './follow-requests';

describe('FollowRequests', () => {
  let component: FollowRequests;
  let fixture: ComponentFixture<FollowRequests>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FollowRequests],
    }).compileComponents();

    fixture = TestBed.createComponent(FollowRequests);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
