import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeleteAccount } from './delete-account';

describe('DeleteAccount', () => {
  let component: DeleteAccount;
  let fixture: ComponentFixture<DeleteAccount>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeleteAccount],
    }).compileComponents();

    fixture = TestBed.createComponent(DeleteAccount);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('disables the submit button until password and confirmation are provided', () => {
    component.openPanel();
    fixture.detectChanges();

    const submitButton = fixture.nativeElement.querySelector(
      '#delete-panel button[type="submit"]',
    ) as HTMLButtonElement;

    expect(submitButton.disabled).toBe(true);

    component.model.set({ password: 'secret', confirm: false });
    fixture.detectChanges();
    expect(submitButton.disabled).toBe(true);

    component.model.set({ password: '', confirm: true });
    fixture.detectChanges();
    expect(submitButton.disabled).toBe(true);

    component.model.set({ password: 'secret', confirm: true });
    fixture.detectChanges();
    expect(submitButton.disabled).toBe(false);
  });
});
