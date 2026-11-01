import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdateForum } from './update-forum';

describe('UpdateForum', () => {
  let component: UpdateForum;
  let fixture: ComponentFixture<UpdateForum>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpdateForum],
    }).compileComponents();

    fixture = TestBed.createComponent(UpdateForum);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
