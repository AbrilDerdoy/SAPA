import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DoctorQuickSearch } from './doctor-quick-search';

describe('DoctorQuickSearch', () => {
  let component: DoctorQuickSearch;
  let fixture: ComponentFixture<DoctorQuickSearch>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DoctorQuickSearch],
    }).compileComponents();

    fixture = TestBed.createComponent(DoctorQuickSearch);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
