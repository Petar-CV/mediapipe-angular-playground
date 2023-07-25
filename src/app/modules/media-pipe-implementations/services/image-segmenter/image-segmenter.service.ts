import { Injectable } from '@angular/core';
import {
  FilesetResolver,
  ImageSegmenter,
  ImageSegmenterResult,
} from '@mediapipe/tasks-vision';

@Injectable()
export class ImageSegmenterService {
  private imageSegmenter?: ImageSegmenter;
  private legendColors = [
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

  public loadCustomModel(modelAssetPath: string): void {
    this.imageSegmenter?.applyOptions({
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
    canvasCtx: CanvasRenderingContext2D | null
  ): Promise<void> {
    if (!this.imageSegmenter || !canvasCtx || !videoElement) {
      return;
    }

    canvasCtx.drawImage(
      videoElement,
      0,
      0,
      videoElement.videoWidth,
      videoElement.videoHeight
    );

    this.imageSegmenter.segmentForVideo(
      videoElement,
      performance.now(),
      (result) =>
        this.callbackForVideo.bind(this)(result, videoElement, canvasCtx)
    );
  }

  private callbackForVideo(
    result: ImageSegmenterResult,
    videoElement: HTMLVideoElement,
    canvasCtx: CanvasRenderingContext2D | null
  ): void {
    const categoryMask = result.categoryMask;

    if (!categoryMask || !canvasCtx) {
      return;
    }

    const imageData = canvasCtx.getImageData(
      0,
      0,
      videoElement.videoWidth,
      videoElement.videoHeight
    ).data;

    const maskData = categoryMask.getAsFloat32Array();

    let j = 0;
    for (let i = 0; i < maskData.length; ++i) {
      const maskVal = Math.round(maskData[i] * 255.0);
      const legendColor = this.legendColors[maskVal % this.legendColors.length];
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
    canvasCtx.putImageData(dataNew, 0, 0);
  }

  public dispose(): void {
    this.imageSegmenter = undefined;
  }

  private initialize(): void {
    this.setupImageSegmenter();
  }

  private async setupImageSegmenter(): Promise<void> {
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
  }
}
