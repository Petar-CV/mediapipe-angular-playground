import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Subscription } from 'rxjs';

import { CameraService } from 'src/app/shared/services/camera-service/camera.service';

import { ImageSegmenterService } from '../../services/image-segmenter/image-segmenter.service';

@Component({
  selector: 'app-selfie-segmentation',
  templateUrl: './selfie-segmentation.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelfieSegmentationComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  @ViewChild('webcamVideo')
  public webcamVideo!: ElementRef<HTMLVideoElement>;

  @ViewChild('outputCanvas')
  public outputCanvas!: ElementRef<HTMLCanvasElement>;

  public cameras$ = this.cameraService.getCameras$();
  public selectedCamera?: MediaDeviceInfo;

  private subscriptions: Subscription[] = [];
  private animationFrameId?: number;
  private onDataLoaded = () => {
    this.predictWebcam(this.selectedCamera?.deviceId);
  };

  constructor(
    private cdr: ChangeDetectorRef,
    private cameraService: CameraService,
    private imageSegmenterService: ImageSegmenterService
  ) {}

  public ngOnInit(): void {
    this.subscriptions.push(
      this.cameraService.getSelectedCamera$().subscribe((camera) => {
        this.selectedCamera = camera;
        this.cdr.detectChanges();
      })
    );
  }

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

  public ngOnDestroy(): void {
    this.imageSegmenterService.dispose();

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }

    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
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

    this.animationFrameId = requestAnimationFrame(() =>
      this.predictWebcam(currentCameraId)
    );
  }
}
