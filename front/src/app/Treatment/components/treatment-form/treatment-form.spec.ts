import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TreatmentForm } from './treatment-form';

describe('TreatmentForm', () => {
  let component: TreatmentForm;
  let fixture: ComponentFixture<TreatmentForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TreatmentForm],
    }).compileComponents();

    fixture = TestBed.createComponent(TreatmentForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
