import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatientProfile } from './patient-profile';

describe('PatientProfile', () => {
  let component: PatientProfile;
  let fixture: ComponentFixture<PatientProfile>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PatientProfile],
    }).compileComponents();

    fixture = TestBed.createComponent(PatientProfile);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
