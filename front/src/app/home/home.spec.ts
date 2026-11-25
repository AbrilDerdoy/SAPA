import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { Home } from './home';
import { Auth } from '../Usuario/services/Auth/auth';
import { QuestionnaireService } from '../Questionnaire/services/questionnaire.service';

describe('Home', () => {
  let component: Home;
  let fixture: ComponentFixture<Home>;
  let hasActiveTutor = false;

  const authMock = {
    sessionVersion: signal(0),
    isPatient: () => true,
    requiresTutor: () => true,
    hasActiveTutor: () => hasActiveTutor,
    isAuthenticated: () => true,
  };
  const questionnaireMock = {
    getMyAssignments: () => of([]),
  };

  beforeEach(async () => {
    hasActiveTutor = false;

    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [
        { provide: Auth, useValue: authMock },
        { provide: QuestionnaireService, useValue: questionnaireMock },
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Home);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('hides the welcome message for a minor patient', () => {
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).not.toContain('¡Bienvenido a SAPA!');
    expect(fixture.nativeElement.querySelector('.welcome')).toBeNull();
  });

  it('shows the tutor notice centered on screen for a restricted patient without a tutor', () => {
    fixture.detectChanges();

    const home: HTMLElement = fixture.nativeElement.querySelector('.home');
    const layout: HTMLElement = fixture.nativeElement.querySelector('.home-layout');

    expect(home.classList.contains('home--restricted')).toBe(true);
    expect(layout.classList.contains('home-layout--restricted')).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Necesitás un tutor para continuar');
    expect(fixture.nativeElement.textContent).toContain('Solicitar tutela');
    expect(fixture.nativeElement.querySelector('.home-sidebar')).toBeNull();
    expect(fixture.nativeElement.querySelector('.restriction-notice')).not.toBeNull();
  });

  it('keeps the restriction for a minor patient who already has a tutor', async () => {
    hasActiveTutor = true;
    authMock.sessionVersion.update(version => version + 1);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).not.toContain('¡Bienvenido a SAPA!');
    expect(fixture.nativeElement.textContent).toContain('Tu tutor gestiona tu cuenta');
    expect(fixture.nativeElement.textContent).toContain('Ver mi tutor');
    expect(fixture.nativeElement.querySelector('.home-sidebar')).toBeNull();
    expect(fixture.nativeElement.querySelector('.restriction-notice')).not.toBeNull();
  });
});
