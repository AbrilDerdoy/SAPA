import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';

import { Auth } from '../../../Usuario/services/Auth/auth';
import { ChatService } from '../../../Chat/services/chat.service';
import { DoctorService } from '../../../Doctor/service/doctor.service';
import { MedicalRecordMovement } from '../../interfaces/medical-record-movement';
import { MedicalRecordService } from '../../services/medical-record-service';
import { MedicalRecordHistory } from './medical-record-history';

describe('MedicalRecordHistory', () => {
  let component: MedicalRecordHistory;
  let fixture: ComponentFixture<MedicalRecordHistory>;
  const isDoctor = signal(true);
  const currentDoctorId = signal<number | null>(20);

  const movement: MedicalRecordMovement = {
    id: 1,
    patientId: 10,
    doctorId: 20,
    doctorName: 'Médico responsable',
    type: 'Consulta',
    title: 'Control',
    comment: 'Seguimiento',
    attachments: [],
    previousVersionId: null,
    supersededById: null,
    createdAt: '2026-01-01T10:00:00',
    updatedAt: null,
    deleted: false,
    deletedAt: null,
    conversationId: null
  };

  beforeEach(async () => {
    isDoctor.set(true);
    currentDoctorId.set(20);

    await TestBed.configureTestingModule({
      imports: [MedicalRecordHistory],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: { get: () => '10' }
            }
          }
        },
        { provide: Router, useValue: { navigate: vi.fn() } },
        { provide: Location, useValue: { back: vi.fn() } },
        {
          provide: Auth,
          useValue: { isDoctor: () => isDoctor() }
        },
        {
          provide: DoctorService,
          useValue: {
            myId: currentDoctorId,
            loadMyId: vi.fn(),
            getSentFollowRequests: () => of([])
          }
        },
        {
          provide: MedicalRecordService,
          useValue: {
            getAllMovements: () => of([
              isDoctor()
                ? movement
                : { ...movement, conversationId: 30 }
            ]),
            filterMovements: () => of([
              isDoctor()
                ? movement
                : { ...movement, conversationId: 30 }
            ])
          }
        },
        {
          provide: ChatService,
          useValue: { getConversations: () => of([]) }
        }
      ]
    }).compileComponents();
  });

  function createFixture(): void {
    fixture = TestBed.createComponent(MedicalRecordHistory);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('hides the chat button from the doctor responsible for the movement', () => {
    createFixture();

    expect(fixture.nativeElement.querySelector('.chat-link-button')).toBeNull();
  });

  it('shows the chat button to another doctor with access', () => {
    currentDoctorId.set(21);
    createFixture();

    expect(fixture.nativeElement.querySelector('.chat-link-button')).not.toBeNull();
  });

  it('shows the chat button to the patient when a conversation exists', () => {
    isDoctor.set(false);
    createFixture();

    expect(fixture.nativeElement.querySelector('.chat-link-button')).not.toBeNull();
  });
});
