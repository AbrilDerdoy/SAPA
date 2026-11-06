import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MedicalRecordDetail } from './medical-record-detail';

describe('MedicalRecordDetail', () => {
  let component: MedicalRecordDetail;
  let fixture: ComponentFixture<MedicalRecordDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MedicalRecordDetail],
    }).compileComponents();

    fixture = TestBed.createComponent(MedicalRecordDetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
