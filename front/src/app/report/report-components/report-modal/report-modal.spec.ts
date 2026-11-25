import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportModal } from './report-modal';

describe('ReportModal', () => {
  let component: ReportModal;
  let fixture: ComponentFixture<ReportModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportModal],
    }).compileComponents();

    fixture = TestBed.createComponent(ReportModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
