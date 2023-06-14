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
  selector: 'app-gesture-detection-implementation',
  templateUrl: './gesture-detection-implementation.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GestureDetectionImplementationComponent implements AfterViewInit {
  @ViewChild('videoElement')
  public videoElement?: ElementRef<HTMLVideoElement>;
  @ViewChild('outputCanvas')
  public outputCanvas?: ElementRef<HTMLCanvasElement>;
  public gestureDetected = '';
  public showLandmarks = false;

  private gestureRecognizer?: GestureRecognizer;
  private lastVideoTime = -1;
  private results?: GestureRecognizerResult;
  private lastGestureDetected = '';
  private lastGestureDetectedTime = 0;

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

      this.handleGesture(categoryName);
    } else {
      this.gestureDetected = 'GestureRecognizer: No gesture detected';

      this.handleGesture('');
    }

    this.cdr.detectChanges();

    requestAnimationFrame(() => this.predictWebcam());
  }

  private handleGesture(gestureName: string): void {
    if (gestureName === '' || gestureName === 'None') {
      this.lastGestureDetected = '';
      this.lastGestureDetectedTime = 0;
      return;
    }

    if (
      this.lastGestureDetected === '' ||
      this.lastGestureDetected === 'None'
    ) {
      this.lastGestureDetected = gestureName;
      this.lastGestureDetectedTime = Date.now();
      return;
    }

    if (this.lastGestureDetected !== gestureName) {
      this.lastGestureDetected = gestureName;
      this.lastGestureDetectedTime = Date.now();
      return;
    }

    if (this.lastGestureDetected === gestureName) {
      this.checkIfGesturePresentLongerThanThreeSeconds();
      return;
    }
  }

  private checkIfGesturePresentLongerThanThreeSeconds(): void {
    const currentTime = Date.now();
    const timeDifference = currentTime - this.lastGestureDetectedTime;

    if (timeDifference > 3000) {
      this.performActionForGesture(this.lastGestureDetected);
    }
  }

  private performActionForGesture(gestureName: string): void {
    this.lastGestureDetected = '';
    this.lastGestureDetectedTime = 0;

    switch (gestureName) {
      case 'Open_Palm':
        window.open('https://www.youtube.com', '_blank');
        break;
      case 'Pointing_Up':
        window.open('https://www.google.com', '_blank');
        break;
      case 'Closed_Fist':
        window.open('https://www.vub.hr', '_blank');
        break;
      default:
        break;
    }
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
