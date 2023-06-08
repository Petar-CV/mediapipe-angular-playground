import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import {
  FilesetResolver,
  GestureRecognizerResult,
  GestureRecognizer,
} from '@mediapipe/tasks-vision';

@Component({
  selector: 'app-gesture-detection-home',
  templateUrl: './gesture-detection-home.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GestureDetectionHomeComponent implements AfterViewInit {
  @ViewChild('videoElement')
  public videoElement?: ElementRef<HTMLVideoElement>;
  @ViewChild('outputCanvas')
  public outputCanvas?: ElementRef<HTMLCanvasElement>;
  public gestureDetected = '';
  public showLandmarks = false;

  private gestureRecognizer?: GestureRecognizer;
  private lastVideoTime = -1;
  private results?: GestureRecognizerResult;

  public constructor(private cdr: ChangeDetectorRef) {}

  public async ngAfterViewInit(): Promise<void> {
    await this.createGestureRecognizer();
    this.enableCamera();
  }

  private enableCamera(): void {
    const videoElement = this.videoElement?.nativeElement;
    if (videoElement) {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((stream) => {
          videoElement.srcObject = stream;
          videoElement.addEventListener('loadeddata', () =>
            this.predictWebcam()
          );
          const bla = GestureRecognizer.HAND_CONNECTIONS;
          bla;
        })
        .catch((error) => {
          console.error(error);
        });
    }
  }

  private async predictWebcam(): Promise<void> {
    const video = this.videoElement?.nativeElement;
    const canvas = this.outputCanvas?.nativeElement;
    const canvasCtx = canvas?.getContext('2d');

    if (!video || !canvas || !canvasCtx || !this.gestureRecognizer) {
      return;
    }

    canvas.style.width = video.videoWidth.toString();
    canvas.style.height = video.videoHeight.toString();
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const startTimeMs = performance.now();
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

    requestAnimationFrame(() => this.predictWebcam());
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
