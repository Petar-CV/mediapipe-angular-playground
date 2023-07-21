import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelfieSegmentationAndHandDetectionComponent } from './selfie-segmentation-and-hand-detection.component';

describe('SelfieSegmentationAndHandDetectionComponent', () => {
  let component: SelfieSegmentationAndHandDetectionComponent;
  let fixture: ComponentFixture<SelfieSegmentationAndHandDetectionComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SelfieSegmentationAndHandDetectionComponent],
    });
    fixture = TestBed.createComponent(
      SelfieSegmentationAndHandDetectionComponent
    );
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
