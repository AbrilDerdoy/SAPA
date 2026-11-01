import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateForum } from './create-forum';

describe('CreateForum', () => {
  let component: CreateForum;
  let fixture: ComponentFixture<CreateForum>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateForum],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateForum);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
