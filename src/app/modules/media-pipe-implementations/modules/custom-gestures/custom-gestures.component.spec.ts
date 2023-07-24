import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomGesturesComponent } from './custom-gestures.component';

describe('CustomGesturesComponent', () => {
  let component: CustomGesturesComponent;
  let fixture: ComponentFixture<CustomGesturesComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CustomGesturesComponent],
    });
    fixture = TestBed.createComponent(CustomGesturesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
