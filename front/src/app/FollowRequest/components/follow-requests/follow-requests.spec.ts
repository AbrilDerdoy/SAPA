import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { FollowRequestService } from '../../service/follow-request.service';
import { FollowRequests } from './follow-requests';

describe('FollowRequests', () => {
  let fixture: ComponentFixture<FollowRequests>;
  const getSent = vi.fn(() => of([]));

  beforeEach(async () => {
    getSent.mockClear();

    await TestBed.configureTestingModule({
      imports: [FollowRequests],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              data: { mode: 'patient' },
              queryParamMap: { get: () => '42' }
            }
          }
        },
        {
          provide: FollowRequestService,
          useValue: {
            getSent,
            getPending: () => of([]),
            getFollowers: () => of([])
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(FollowRequests);
    fixture.detectChanges();
  });

  it('loads follow requests for the selected tutored patient', () => {
    expect(getSent).toHaveBeenCalledWith(42);
  });
});
