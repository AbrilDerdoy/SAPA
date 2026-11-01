import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MedicationSearch } from './medication-search';

describe('MedicationSearch', () => {
  let component: MedicationSearch;
  let fixture: ComponentFixture<MedicationSearch>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MedicationSearch]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MedicationSearch);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
