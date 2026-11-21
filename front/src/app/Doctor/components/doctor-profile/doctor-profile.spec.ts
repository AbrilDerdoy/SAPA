import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DoctorProfile } from './doctor-profile';

describe('DoctorProfile', () => {
  let component: DoctorProfile;
  let fixture: ComponentFixture<DoctorProfile>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DoctorProfile],
    }).compileComponents();

    fixture = TestBed.createComponent(DoctorProfile);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
