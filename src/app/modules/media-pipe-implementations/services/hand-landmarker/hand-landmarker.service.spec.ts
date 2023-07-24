import { TestBed } from '@angular/core/testing';

import { HandLandmarkerService } from './hand-landmarker.service';

describe('HandLandmarkerService', () => {
  let service: HandLandmarkerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HandLandmarkerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
