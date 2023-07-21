import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  FilesetResolver,
  ImageSegmenter,
  ImageSegmenterResult,
} from '@mediapipe/tasks-vision';

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
  selector: 'app-selfie-segmentation',
  templateUrl: './selfie-segmentation.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelfieSegmentationComponent implements OnInit, AfterViewInit {
  @ViewChild('webcamVideo')
  public webcamVideo!: ElementRef<HTMLVideoElement>;

  @ViewChild('outputCanvas')
  public outputCanvas!: ElementRef<HTMLCanvasElement>;

  public cameras: MediaDeviceInfo[] = [];
  public selectedCamera?: MediaDeviceInfo;

  private imageSegmenter?: ImageSegmenter;
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
    this.setupImageSegmenter();
    this.enableCamera();
  }

  public onSelectedCameraChange(): void {
    this.enableCamera();
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

  private async predictWebcam(currentCameraId?: string) {
    const videoElement: HTMLVideoElement = this.webcamVideo.nativeElement;
    const selectedCameraId = this.selectedCamera?.deviceId;

    if (selectedCameraId !== currentCameraId) {
      return;
    }

    if (!this.imageSegmenter || !this.canvasCtx || !videoElement) {
      return;
    }

    if (videoElement.currentTime === this.lastWebcamTime) {
      requestAnimationFrame(() => this.predictWebcam(currentCameraId));
      return;
    }

    this.lastWebcamTime = videoElement.currentTime;

    this.canvasCtx.drawImage(
      videoElement,
      0,
      0,
      videoElement.videoWidth,
      videoElement.videoHeight
    );

    this.imageSegmenter.segmentForVideo(
      videoElement,
      performance.now(),
      (result) => this.callbackForVideo.bind(this)(result, currentCameraId)
    );
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
