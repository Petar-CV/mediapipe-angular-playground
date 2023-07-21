import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestureDetectionSegmentationComponent } from './gesture-detection-segmentation.component';

describe('GestureDetectionSegmentationComponent', () => {
  let component: GestureDetectionSegmentationComponent;
  let fixture: ComponentFixture<GestureDetectionSegmentationComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [GestureDetectionSegmentationComponent],
    });
    fixture = TestBed.createComponent(GestureDetectionSegmentationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
