import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import {
  FilesetResolver,
  GestureRecognizerResult,
  GestureRecognizer,
} from '@mediapipe/tasks-vision';
import { Subscription } from 'rxjs';

import { CameraService } from 'src/app/shared/services/camera-service/camera.service';

@Component({
  selector: 'app-stock-gestures',
  templateUrl: './stock-gestures.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StockGesturesComponent implements AfterViewInit, OnDestroy {
  @ViewChild('webcamVideo')
  public webcamVideo!: ElementRef<HTMLVideoElement>;

  @ViewChild('outputCanvas')
  public outputCanvas!: ElementRef<HTMLCanvasElement>;

  public gestureDetected = '';
  public showLandmarks = false;
  public cameras$ = this.cameraService.getCameras$();
  public selectedCamera?: MediaDeviceInfo;

  private subscriptions: Subscription[] = [];
  private gestureRecognizer?: GestureRecognizer;
  private lastVideoTime = -1;
  private results?: GestureRecognizerResult;
  private animationFrameId?: number;
  private onDataLoaded = () => {
    this.predictWebcam(this.selectedCamera?.deviceId);
  };

  public constructor(
    private cdr: ChangeDetectorRef,
    private cameraService: CameraService
  ) {
    this.subscriptions.push(
      this.cameraService.getSelectedCamera$().subscribe((camera) => {
        this.selectedCamera = camera;
        this.cdr.detectChanges();
      })
    );
  }

  public ngAfterViewInit(): void {
    this.createGestureRecognizer();
    this.cameraService.enableCameraForVideoElement(
      this.webcamVideo.nativeElement,
      this.onDataLoaded
    );
  }

  public onSelectedCameraChange(): void {
    this.cameraService.setSelectedCamera(this.selectedCamera);
    this.cameraService.enableCameraForVideoElement(
      this.webcamVideo.nativeElement,
      this.onDataLoaded
    );
  }

  public ngOnDestroy(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }

    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }

  private async predictWebcam(currentCameraId?: string): Promise<void> {
    const videoElement = this.webcamVideo?.nativeElement;
    const canvasElement = this.outputCanvas?.nativeElement;
    const canvasCtx = canvasElement?.getContext('2d');
    const selectedCameraId = this.selectedCamera?.deviceId;

    if (selectedCameraId !== currentCameraId) {
      return;
    }

    if (
      !videoElement ||
      !canvasElement ||
      !canvasCtx ||
      !this.gestureRecognizer
    ) {
      return;
    }

    canvasElement.style.width = videoElement.videoWidth.toString();
    canvasElement.style.height = videoElement.videoHeight.toString();
    canvasElement.width = videoElement.videoWidth;
    canvasElement.height = videoElement.videoHeight;

    const startTimeMs = performance.now();
    if (this.lastVideoTime !== videoElement.currentTime) {
      this.lastVideoTime = videoElement.currentTime;
      this.results = this.gestureRecognizer.recognizeForVideo(
        videoElement,
        startTimeMs
      );
    }

    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    if (this.results?.landmarks && this.showLandmarks) {
      for (const landmarks of this.results.landmarks) {
        drawConnectors(
          canvasCtx,
          landmarks,
          GestureRecognizer.HAND_CONNECTIONS.map((connection) => [
            connection.start,
            connection.end,
          ])
        );
        drawLandmarks(canvasCtx, landmarks, { color: '#FF0000', lineWidth: 2 });
      }
    }
    canvasCtx.restore();

    if (this.results?.gestures && this.results.gestures.length > 0) {
      const result = this.results.gestures[0][0];
      const categoryName = result.categoryName;
      const categoryScore = (result.score * 100).toFixed(2);
      this.gestureDetected = `GestureRecognizer: ${categoryName}\n Confidence: ${categoryScore} %`;
    } else {
      this.gestureDetected = 'GestureRecognizer: No gesture detected';
    }

    this.cdr.detectChanges();

    this.animationFrameId = requestAnimationFrame(() =>
      this.predictWebcam(currentCameraId)
    );
  }

  private async createGestureRecognizer(): Promise<void> {
    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm'
    );
    this.gestureRecognizer = await GestureRecognizer.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task',
        delegate: 'GPU',
      },
      runningMode: 'VIDEO',
      numHands: 2,
    });
  }
}
