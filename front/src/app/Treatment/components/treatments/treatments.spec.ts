import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Treatments } from './treatments';

describe('Treatments', () => {
  let component: Treatments;
  let fixture: ComponentFixture<Treatments>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Treatments],
    }).compileComponents();

    fixture = TestBed.createComponent(Treatments);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
