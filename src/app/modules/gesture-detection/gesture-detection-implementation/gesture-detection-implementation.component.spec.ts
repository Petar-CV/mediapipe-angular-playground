import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestureDetectiondImplementationComponent } from './gesture-detection-implementation.component';

describe('GestureDetectiondImplementationComponent', () => {
  let component: GestureDetectiondImplementationComponent;
  let fixture: ComponentFixture<GestureDetectiondImplementationComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [GestureDetectiondImplementationComponent],
    });
    fixture = TestBed.createComponent(GestureDetectiondImplementationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
