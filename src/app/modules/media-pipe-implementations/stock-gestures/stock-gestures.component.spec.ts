import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StockGesturesComponent } from './stock-gestures.component';

describe('StockGesturesComponent', () => {
  let component: StockGesturesComponent;
  let fixture: ComponentFixture<StockGesturesComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [StockGesturesComponent],
    });
    fixture = TestBed.createComponent(StockGesturesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
