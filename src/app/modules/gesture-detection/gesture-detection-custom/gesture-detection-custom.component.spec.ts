import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestureDetectiondCustomComponent } from './gesture-detection-custom.component';

describe('GestureDetectiondCustomComponent', () => {
  let component: GestureDetectiondCustomComponent;
  let fixture: ComponentFixture<GestureDetectiondCustomComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [GestureDetectiondCustomComponent],
    });
    fixture = TestBed.createComponent(GestureDetectiondCustomComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
