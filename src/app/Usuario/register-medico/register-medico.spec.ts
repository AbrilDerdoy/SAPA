import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegisterMedico } from './register-medico';

describe('RegisterMedico', () => {
  let component: RegisterMedico;
  let fixture: ComponentFixture<RegisterMedico>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterMedico],
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterMedico);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
