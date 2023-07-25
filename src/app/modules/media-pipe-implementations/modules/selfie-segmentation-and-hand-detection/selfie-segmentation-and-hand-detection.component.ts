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
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import {
  FilesetResolver,
  HandLandmarker,
  HandLandmarkerResult,
  ImageSegmenter,
  ImageSegmenterResult,
} from '@mediapipe/tasks-vision';
import { Subscription } from 'rxjs';

import { CameraService } from 'src/app/shared/services/camera-service/camera.service';

const legendColors = [
  [255, 197, 0, 255], // Vivid Yellow
  [128, 62, 117, 255], // Strong Purple
  [255, 104, 0, 255], // Vivid Orange
  [166, 189, 215, 255], // Very Light Blue
  [193, 0, 32, 255], // Vivid Red
  [206, 162, 98, 255], // Grayish Yellow
  [129, 112, 102, 255], // Medium Gray
  [0, 125, 52, 255], // Vivid Green
  [246, 118, 142, 255], // Strong Purplish Pink
  [0, 83, 138, 255], // Strong Blue
  [255, 112, 92, 255], // Strong Yellowish Pink
  [83, 55, 112, 255], // Strong Violet
  [255, 142, 0, 255], // Vivid Orange Yellow
  [179, 40, 81, 255], // Strong Purplish Red
  [244, 200, 0, 255], // Vivid Greenish Yellow
  [127, 24, 13, 255], // Strong Reddish Brown
  [147, 170, 0, 255], // Vivid Yellowish Green
  [89, 51, 21, 255], // Deep Yellowish Brown
  [241, 58, 19, 255], // Vivid Reddish Orange
  [35, 44, 22, 255], // Dark Olive Green
  [0, 161, 194, 255], // Vivid Blue
];

@Component({
  selector: 'app-selfie-segmentation-and-hand-detection',
  templateUrl: './selfie-segmentation-and-hand-detection.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelfieSegmentationAndHandDetectionComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  @ViewChild('webcamVideo')
  public webcamVideo!: ElementRef<HTMLVideoElement>;

  @ViewChild('outputCanvas')
  public outputCanvas!: ElementRef<HTMLCanvasElement>;

  public cameras$ = this.cameraService.getCameras$();
  public selectedCamera?: MediaDeviceInfo;
  public mirrorWebcam = true;

  private subscriptions: Subscription[] = [];
  private imageSegmenter?: ImageSegmenter;
  private handLandmarker?: HandLandmarker;
  private results?: HandLandmarkerResult;
  private canvasCtx?: CanvasRenderingContext2D | null;
  private animationFrameId?: number;
  private onDataLoaded = () => {
    this.predictWebcam(this.selectedCamera?.deviceId);
  };

  constructor(
    private cdr: ChangeDetectorRef,
    private cameraService: CameraService
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
    this.setupImageSegmenter();
    this.setupHandLandmarker();
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

  private async setupImageSegmenter() {
    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.2/wasm'
    );

    this.imageSegmenter = await ImageSegmenter.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite',
        delegate: 'GPU',
      },
      runningMode: 'VIDEO',
      outputCategoryMask: true,
      outputConfidenceMasks: false,
    });

    this.canvasCtx = this.outputCanvas.nativeElement.getContext('2d');
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

    if (
      !this.handLandmarker ||
      !this.imageSegmenter ||
      !this.canvasCtx ||
      !videoElement
    ) {
      return;
    }

    canvasElement.style.width = `${videoElement.videoWidth}px`;
    canvasElement.style.height = `${videoElement.videoHeight}px`;
    canvasElement.width = videoElement.videoWidth;
    canvasElement.height = videoElement.videoHeight;

    this.canvasCtx.drawImage(
      videoElement,
      0,
      0,
      videoElement.videoWidth,
      videoElement.videoHeight
    );

    this.results = this.handLandmarker.detectForVideo(
      videoElement,
      performance.now()
    );

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

    this.imageSegmenter.segmentForVideo(
      videoElement,
      performance.now(),
      (result) => this.callbackForVideo.bind(this)(result, currentCameraId)
    );

    this.canvasCtx.restore();
  }

  private callbackForVideo(
    result: ImageSegmenterResult,
    currentCameraId?: string
  ): void {
    const categoryMask = result.categoryMask;
    const videoElement: HTMLVideoElement = this.webcamVideo.nativeElement;

    if (!categoryMask || !this.canvasCtx) {
      return;
    }

    const imageData = this.canvasCtx.getImageData(
      0,
      0,
      videoElement.videoWidth,
      videoElement.videoHeight
    ).data;

    const maskData = categoryMask.getAsFloat32Array();

    let j = 0;
    for (let i = 0; i < maskData.length; ++i) {
      const maskVal = Math.round(maskData[i] * 255.0);
      const legendColor = legendColors[maskVal % legendColors.length];
      imageData[j] = (legendColor[0] + imageData[j]) / 2;
      imageData[j + 1] = (legendColor[1] + imageData[j + 1]) / 2;
      imageData[j + 2] = (legendColor[2] + imageData[j + 2]) / 2;
      imageData[j + 3] = (legendColor[3] + imageData[j + 3]) / 2;
      j += 4;
    }
    const uint8Array = new Uint8ClampedArray(imageData.buffer);
    const dataNew = new ImageData(
      uint8Array,
      videoElement.videoWidth,
      videoElement.videoHeight
    );
    this.canvasCtx.putImageData(dataNew, 0, 0);

    this.animationFrameId = requestAnimationFrame(() =>
      this.predictWebcam(currentCameraId)
    );
  }
}
