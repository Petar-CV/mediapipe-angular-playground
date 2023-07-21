import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StockHandDetectionComponent } from './stock-hand-detection.component';

describe('StockHandDetectionComponent', () => {
  let component: StockHandDetectionComponent;
  let fixture: ComponentFixture<StockHandDetectionComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [StockHandDetectionComponent],
    });
    fixture = TestBed.createComponent(StockHandDetectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
