import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { DoctorProfilePublic } from './doctor-profile-public';

describe('DoctorProfilePublic', () => {
  let component: DoctorProfilePublic;
  let fixture: ComponentFixture<DoctorProfilePublic>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DoctorProfilePublic],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(DoctorProfilePublic);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
