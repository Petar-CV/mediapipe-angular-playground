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
  selector: 'app-custom-gestures',
  templateUrl: './custom-gestures.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomGesturesComponent implements AfterViewInit, OnDestroy {
  @ViewChild('webcamVideo')
  public webcamVideo!: ElementRef<HTMLVideoElement>;

  @ViewChild('outputCanvas')
  public outputCanvas!: ElementRef<HTMLCanvasElement>;

  public gestureDetected = '';
  public showLandmarks = false;
  public cameras$ = this.cameraService.getCameras$();
  public selectedCamera?: MediaDeviceInfo;
  public mirrorWebcam = true;

  private subscriptions: Subscription[] = [];
  private animationFrameId?: number;
  private gestureRecognizer?: GestureRecognizer;
  private lastVideoTime = -1;
  private results?: GestureRecognizerResult;
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
    const video = this.webcamVideo?.nativeElement;
    const canvas = this.outputCanvas?.nativeElement;
    const canvasCtx = canvas?.getContext('2d');
    const selectedCameraId = this.selectedCamera?.deviceId;

    if (selectedCameraId !== currentCameraId) {
      return;
    }

    if (!video || !canvas || !canvasCtx || !this.gestureRecognizer) {
      return;
    }

    canvas.style.width = video.videoWidth.toString();
    canvas.style.height = video.videoHeight.toString();
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const startTimeMs = Date.now();
    if (this.lastVideoTime !== video.currentTime) {
      this.lastVideoTime = video.currentTime;
      this.results = this.gestureRecognizer.recognizeForVideo(
        video,
        startTimeMs
      );
    }

    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
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
        modelAssetPath: 'assets/ml-models/custom_gesture_recognizer.task',
        delegate: 'GPU',
      },
      runningMode: 'VIDEO',
      numHands: 2,
    });
  }
}
