import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
} from '@angular/core';

import { CameraService } from 'src/app/shared/services/camera-service/camera.service';

import { HandLandmarkerService } from '../../services/hand-landmarker/hand-landmarker.service';

@Component({
  selector: 'app-stock-hand-detection',
  templateUrl: './stock-hand-detection.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StockHandDetectionComponent implements AfterViewInit, OnDestroy {
  @ViewChild('webcamVideo')
  public webcamVideo!: ElementRef<HTMLVideoElement>;

  @ViewChild('outputCanvas')
  public outputCanvas!: ElementRef<HTMLCanvasElement>;

  public cameras$ = this.cameraService.getCameras$();
  public selectedCamera?: MediaDeviceInfo;

  private animationFrameId?: number;
  private onDataLoaded = () => {
    this.predictWebcam(this.selectedCamera?.deviceId);
  };

  constructor(
    private cameraService: CameraService,
    private handLandmarkerService: HandLandmarkerService
  ) {}

  public ngAfterViewInit(): void {
    const videoElement = this.webcamVideo.nativeElement;
    const canvasElement = this.outputCanvas.nativeElement;

    this.cameraService.enableCameraForVideoElement(videoElement, () => {
      this.onDataLoaded(),
        this.handLandmarkerService.initializeElements(
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

  public ngOnDestroy(): void {
    this.handLandmarkerService.dispose();

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  private async predictWebcam(currentCameraId?: string): Promise<void> {
    const videoElement = this.webcamVideo.nativeElement;
    const canvasElement = this.outputCanvas.nativeElement;
    const canvasCtx = canvasElement.getContext('2d');
    const selectedCameraId = this.selectedCamera?.deviceId;

    // If the camera has changed, stop predicting previous camera data
    if (selectedCameraId !== currentCameraId) {
      return;
    }

    this.handLandmarkerService.predictWebcam(
      videoElement,
      canvasElement,
      canvasCtx
    );

    this.animationFrameId = requestAnimationFrame(() =>
      this.predictWebcam(currentCameraId)
    );
  }
}
