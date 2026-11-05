import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatientMedicalRecord } from './patient-medical-record';

describe('PatientMedicalRecord', () => {
  let component: PatientMedicalRecord;
  let fixture: ComponentFixture<PatientMedicalRecord>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PatientMedicalRecord],
    }).compileComponents();

    fixture = TestBed.createComponent(PatientMedicalRecord);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
