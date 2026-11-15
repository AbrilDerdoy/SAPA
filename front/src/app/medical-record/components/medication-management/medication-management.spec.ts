import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MedicationManagement } from './medication-management';

describe('MedicationManagement', () => {
  let component: MedicationManagement;
  let fixture: ComponentFixture<MedicationManagement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MedicationManagement],
    }).compileComponents();

    fixture = TestBed.createComponent(MedicationManagement);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
