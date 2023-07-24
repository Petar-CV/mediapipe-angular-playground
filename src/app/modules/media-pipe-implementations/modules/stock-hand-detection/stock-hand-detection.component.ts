import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
} from '@angular/core';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import {
  FilesetResolver,
  HandLandmarker,
  HandLandmarkerResult,
} from '@mediapipe/tasks-vision';

@Component({
  selector: 'app-stock-hand-detection',
  templateUrl: './stock-hand-detection.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StockHandDetectionComponent implements OnInit, AfterViewInit {
  @ViewChild('webcamVideo')
  public webcamVideo!: ElementRef<HTMLVideoElement>;

  @ViewChild('outputCanvas')
  public outputCanvas!: ElementRef<HTMLCanvasElement>;

  public cameras: MediaDeviceInfo[] = [];
  public selectedCamera?: MediaDeviceInfo;

  private handLandmarker?: HandLandmarker;
  private results?: HandLandmarkerResult;
  private canvasCtx?: CanvasRenderingContext2D | null;
  private lastWebcamTime = 0;
  private onDataLoaded = () => {
    this.predictWebcam(this.selectedCamera?.deviceId);
  };

  constructor(private cdr: ChangeDetectorRef) {}

  public ngOnInit(): void {
    this.getListOfCameras();
  }

  public ngAfterViewInit(): void {
    this.setupHandLandmarker();
    this.enableCamera();
  }

  public onSelectedCameraChange(): void {
    this.enableCamera();
  }

  private async setupHandLandmarker() {
    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.2/wasm'
    );

    this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
        delegate: 'GPU',
      },
      runningMode: 'VIDEO',
      numHands: 1,
    });

    this.canvasCtx = this.outputCanvas.nativeElement.getContext('2d');
  }

  private async predictWebcam(currentCameraId?: string) {
    const videoElement: HTMLVideoElement = this.webcamVideo.nativeElement;
    const canvasElement: HTMLCanvasElement = this.outputCanvas.nativeElement;
    const selectedCameraId = this.selectedCamera?.deviceId;

    if (selectedCameraId !== currentCameraId) {
      return;
    }

    if (!this.handLandmarker || !this.canvasCtx || !videoElement) {
      return;
    }

    canvasElement.style.width = `${videoElement.videoWidth}px`;
    canvasElement.style.height = `${videoElement.videoHeight}px`;
    canvasElement.width = videoElement.videoWidth;
    canvasElement.height = videoElement.videoHeight;

    const startTimeMs = performance.now();
    if (this.lastWebcamTime !== videoElement.currentTime) {
      this.lastWebcamTime = videoElement.currentTime;
      this.results = this.handLandmarker.detectForVideo(
        videoElement,
        startTimeMs
      );
    }

    this.canvasCtx.save();
    this.canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    if (this.results?.landmarks) {
      for (const landmarks of this.results.landmarks) {
        drawConnectors(
          this.canvasCtx,
          landmarks,
          HandLandmarker.HAND_CONNECTIONS.map((connection) => [
            connection.start,
            connection.end,
          ]),
          {
            color: '#00FF00',
            lineWidth: 5,
          }
        );
        drawLandmarks(this.canvasCtx, landmarks, {
          color: '#FF0000',
          lineWidth: 2,
        });
      }
    }
    this.canvasCtx.restore();

    requestAnimationFrame(() => this.predictWebcam(currentCameraId));
  }

  private getListOfCameras(): void {
    this.cameras = [];

    navigator.mediaDevices.enumerateDevices().then((devices) => {
      devices.forEach((device) => {
        if (device.kind === 'videoinput') {
          this.cameras.push(device);
        }
      });

      this.selectedCamera = this.cameras[0];
      this.cdr.detectChanges();
    });
  }

  private enableCamera(): void {
    const videoElement: HTMLVideoElement = this.webcamVideo.nativeElement;

    // Remove existing stream and listeners
    if (videoElement.srcObject) {
      videoElement.srcObject = null;
      videoElement.removeEventListener('loadeddata', this.onDataLoaded);
    }

    navigator.mediaDevices
      .getUserMedia({
        video: {
          deviceId: this.selectedCamera?.deviceId,
        },
        audio: false,
      })
      .then((stream) => {
        videoElement.srcObject = stream;
        videoElement.addEventListener('loadeddata', this.onDataLoaded);
      })
      .catch((error) => {
        console.error(error);
      });
  }
}
