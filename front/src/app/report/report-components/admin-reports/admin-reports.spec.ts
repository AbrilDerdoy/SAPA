import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminReports } from './admin-reports';

describe('AdminReports', () => {
  let component: AdminReports;
  let fixture: ComponentFixture<AdminReports>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminReports],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminReports);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
