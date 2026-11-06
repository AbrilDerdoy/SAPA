import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyPatients } from './my-patients';

describe('MyPatients', () => {
  let component: MyPatients;
  let fixture: ComponentFixture<MyPatients>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyPatients],
    }).compileComponents();

    fixture = TestBed.createComponent(MyPatients);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
