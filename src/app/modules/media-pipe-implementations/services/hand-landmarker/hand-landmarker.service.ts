import { Injectable } from '@angular/core';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import {
  FilesetResolver,
  HandLandmarker,
  HandLandmarkerResult,
} from '@mediapipe/tasks-vision';

@Injectable()
export class HandLandmarkerService {
  private handLandmarker?: HandLandmarker;
  private results?: HandLandmarkerResult;

  public loadCustomModel(modelAssetPath: string): void {
    this.handLandmarker?.applyOptions({
      baseOptions: {
        modelAssetPath,
      },
    });
  }

  public initializeElements(
    videoElement: HTMLVideoElement,
    canvasElement: HTMLCanvasElement
  ): void {
    this.initialize();
    canvasElement.style.width = `${videoElement.clientWidth}px`;
    canvasElement.style.height = `${videoElement.clientHeight}px`;
    canvasElement.width = videoElement.clientWidth;
    canvasElement.height = videoElement.clientHeight;
  }

  public async predictWebcam(
    videoElement: HTMLVideoElement,
    canvasElement: HTMLCanvasElement,
    canvasCtx: CanvasRenderingContext2D | null
  ): Promise<void> {
    this.results = this.handLandmarker?.detectForVideo(
      videoElement,
      performance.now()
    );

    if (!this.results || !canvasCtx || !this.handLandmarker) {
      return;
    }

    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    if (this.results?.landmarks) {
      for (const landmarks of this.results.landmarks) {
        drawConnectors(
          canvasCtx,
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
        drawLandmarks(canvasCtx, landmarks, {
          color: '#FF0000',
          lineWidth: 2,
        });
      }
    }
    canvasCtx.restore();
  }

  public dispose(): void {
    this.handLandmarker = undefined;
  }

  private initialize(): void {
    this.setupHandLandmarker();
    this.results = undefined;
  }

  private async setupHandLandmarker(): Promise<void> {
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
  }
}
