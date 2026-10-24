import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegisterPaciente } from './register-paciente';

describe('RegisterPaciente', () => {
  let component: RegisterPaciente;
  let fixture: ComponentFixture<RegisterPaciente>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterPaciente],
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterPaciente);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
