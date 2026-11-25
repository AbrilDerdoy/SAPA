import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContentMenu } from './content-menu';

describe('ContentMenu', () => {
  let component: ContentMenu;
  let fixture: ComponentFixture<ContentMenu>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContentMenu],
    }).compileComponents();

    fixture = TestBed.createComponent(ContentMenu);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
