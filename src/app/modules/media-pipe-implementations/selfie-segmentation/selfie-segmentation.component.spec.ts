import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelfieSegmentationComponent } from './selfie-segmentation.component';

describe('SelfieSegmentationComponent', () => {
  let component: SelfieSegmentationComponent;
  let fixture: ComponentFixture<SelfieSegmentationComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SelfieSegmentationComponent],
    });
    fixture = TestBed.createComponent(SelfieSegmentationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
