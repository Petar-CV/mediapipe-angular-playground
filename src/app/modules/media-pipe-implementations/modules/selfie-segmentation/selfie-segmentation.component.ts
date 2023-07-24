import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewChild,
} from '@angular/core';

import { CameraService } from 'src/app/shared/services/camera-service/camera.service';

import { ImageSegmenterService } from '../../services/image-segmenter/image-segmenter.service';

@Component({
  selector: 'app-selfie-segmentation',
  templateUrl: './selfie-segmentation.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelfieSegmentationComponent implements AfterViewInit {
  @ViewChild('webcamVideo')
  public webcamVideo!: ElementRef<HTMLVideoElement>;

  @ViewChild('outputCanvas')
  public outputCanvas!: ElementRef<HTMLCanvasElement>;

  public cameras$ = this.cameraService.getCameras$();
  public selectedCamera?: MediaDeviceInfo;

  private canvasCtx?: CanvasRenderingContext2D | null;
  private onDataLoaded = () => {
    this.predictWebcam(this.selectedCamera?.deviceId);
  };

  constructor(
    private cameraService: CameraService,
    private imageSegmenterService: ImageSegmenterService
  ) {}

  public ngAfterViewInit(): void {
    const videoElement = this.webcamVideo.nativeElement;
    const canvasElement = this.outputCanvas.nativeElement;

    this.cameraService.enableCameraForVideoElement(videoElement, () => {
      this.onDataLoaded(),
        this.imageSegmenterService.initializeElements(
          videoElement,
          canvasElement
        );
    });
  }

  public onSelectedCameraChange(): void {
    this.cameraService.setSelectedCamera(this.selectedCamera);
    this.cameraService.enableCameraForVideoElement(
      this.webcamVideo.nativeElement,
      this.onDataLoaded
    );
  }

  private async predictWebcam(currentCameraId?: string): Promise<void> {
    const canvasElement = this.outputCanvas.nativeElement;
    const canvasCtx = canvasElement.getContext('2d');
    const videoElement = this.webcamVideo.nativeElement;
    const selectedCameraId = this.selectedCamera?.deviceId;

    if (selectedCameraId !== currentCameraId) {
      return;
    }

    this.imageSegmenterService.predictWebcam(videoElement, canvasCtx);

    requestAnimationFrame(() => this.predictWebcam(currentCameraId));
  }
}
