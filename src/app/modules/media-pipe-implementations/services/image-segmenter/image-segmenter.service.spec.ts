import { TestBed } from '@angular/core/testing';

import { ImageSegmenterService } from './image-segmenter.service';

describe('ImageSegmenterService', () => {
  let service: ImageSegmenterService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ImageSegmenterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
