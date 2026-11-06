import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyMedicalRecord } from './my-medical-record';

describe('MyMedicalRecord', () => {
  let component: MyMedicalRecord;
  let fixture: ComponentFixture<MyMedicalRecord>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyMedicalRecord],
    }).compileComponents();

    fixture = TestBed.createComponent(MyMedicalRecord);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
