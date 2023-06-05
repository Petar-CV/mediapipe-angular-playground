import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestureDetectionHomeComponent } from './gesture-detection-home.component';

describe('GestureDetectionHomeComponent', () => {
  let component: GestureDetectionHomeComponent;
  let fixture: ComponentFixture<GestureDetectionHomeComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [GestureDetectionHomeComponent]
    });
    fixture = TestBed.createComponent(GestureDetectionHomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
