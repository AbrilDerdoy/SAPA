import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DoctorPatients } from './doctor-patients';

describe('DoctorPatients', () => {
  let component: DoctorPatients;
  let fixture: ComponentFixture<DoctorPatients>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DoctorPatients],
    }).compileComponents();

    fixture = TestBed.createComponent(DoctorPatients);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
