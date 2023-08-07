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
  HandLandmarkerResult,
  HandLandmarker,
  GestureRecognizer,
} from '@mediapipe/tasks-vision';
//import { evaluate } from './evaluation';
// import { GaussianMixtureModel } from './GMM';
//import { NaiveBayes } from './bayes';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - no types
import KNN from 'ml-knn';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - no types
import { MultinomialNB, GaussianNB } from 'ml-naivebayes';
import { Subscription } from 'rxjs';

import { CameraService } from 'src/app/shared/services/camera-service/camera.service';

function cbcrGrayscale(pixels: ImageData) {
  const data = pixels.data;
  const l = data.length;
  const buff = new Uint8ClampedArray(data.length);
  for (let i = 0; i < l; i += 4) {
    const r = data[i],
      g = data[i + 1],
      b = data[i + 2];
    const [y, cb, cr] = rgbToYCbCr(r, g, b);

    buff[i] = buff[i + 1] = buff[i + 2] = (cr / cb) * 255;
    buff[i + 3] = 255;
  }
  pixels.data.set(buff);
}
// Function to get median value of an array
function median(arr: number[]): number {
  arr.sort((a, b) => a - b);
  const half = Math.floor(arr.length / 2);
  return arr.length % 2 ? arr[half] : (arr[half - 1] + arr[half]) / 2;
}

function skinDetector(pixels: ImageData): void {
  const data = pixels.data;
  const buff = new Uint8ClampedArray(pixels.data.length);
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const [h, s, v] = rgbToHsv(r, g, b);
    const [y, cb, cr] = rgbToYCbCr(r, g, b);

    if (135 <= cr && cr <= 180 && 85 <= cb && cb <= 135) {
      //    if (0 <= h && h <= 17 && 0 <= s && s <= 170) {
      buff[i] = 255;
      buff[i + 1] = 255;
      buff[i + 2] = 255;
      buff[i + 3] = 255;
      //    }
    }
  }
  pixels.data.set(buff);
}

function coloredMedianBlur(pixels: ImageData): void {
  const data = pixels.data;
  const w = pixels.width * 4;
  const h = pixels.height;
  const l = data.length - w - 4;
  const buff = new Uint8ClampedArray(data.length);

  for (let y = 2; y < h - 2; y++) {
    for (let x = 2; x < w / 4 - 2; x++) {
      const r = [],
        g = [],
        b = [];

      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const idx = (y + dy) * w + (x + dx) * 4;
          r.push(data[idx]);
          g.push(data[idx + 1]);
          b.push(data[idx + 2]);
        }
      }

      const midx = y * w + x * 4;
      buff[midx] = median(r);
      buff[midx + 1] = median(g);
      buff[midx + 2] = median(b);
      buff[midx + 3] = 255; // alpha
    }
  }

  pixels.data.set(buff);
}

function naiveBayesClassifier(
  imageData: ImageData,
  classifier: { predict: (arg0: number[][]) => number }
): void {
  const resultData = new ImageData(imageData.width, imageData.height);
  for (let i = 0; i < imageData.data.length; i += 24) {
    const r = imageData.data[i],
      g = imageData.data[i + 1],
      b = imageData.data[i + 2];
    //let hsv = rgbToHsv(r, g, b);
    const input = [[r, g, b]].map(([r, g, b]) => rgbToYCbCr(r, g, b).slice(1));
    //const input = [[r, g, b]].map(([r, g, b]) => rgbToHsv(r, g, b).concat([r, g]).concat(rgbToYCbCr(r, g, b)));
    //const input = [[r, g, b]].map(([r, g, b]) => rgbToYCbCr(r, g, b).slice(1));
    const value = classifier.predict(input) * 255;
    resultData.data[i] =
      resultData.data[i + 1] =
      resultData.data[i + 2] =
        value;
    resultData.data[i + 3] = 255;
  }
  imageData.data.set(resultData.data);
}
/*
function separateArmAndBackground(pixels: ImageData, armPixels: number[][]): void {
    
    // Step 2: Create Gaussian Mixture Model
    var gmm = new GaussianMixtureModel();
    gmm.fit(armPixels);

    // Step 3: Segment pixels
    for (var i = 0; i < pixels.data.length; i += 4) {
        // For unknown pixels, assign the category based on GMM probabilities
        var r = pixels.data[i];
        var g = pixels.data[i + 1];
        var b = pixels.data[i + 2];
        var likelihoodArm = gmm.calculateLikelihood([r, g, b]);
        var likelihoodBackground = 1 - likelihoodArm;

        // Threshold the probabilities and assign the pixel to the appropriate category
        var threshold = 0.5;
        if (likelihoodArm > threshold) {
            pixels.data[i] = 255;
            pixels.data[i + 1] = 0;
            pixels.data[i + 2] = 0;
        } else if (likelihoodBackground > threshold) {
            pixels.data[i] = 0;
            pixels.data[i + 1] = 0;
            pixels.data[i + 2] = 255;
        } else {
            pixels.data[i] = 0;
            pixels.data[i + 1] = 0;
            pixels.data[i + 2] = 0;
        }
    }
}*/

//import * as cv from 'opencv.js';
function posterizeHSV(imageData: ImageData, levels: number): void {
  const data = imageData.data;
  const factor = 1 / (levels - 1);

  for (let i = 0; i < data.length; i += 4) {
    // Convert to HSV
    let r = data[i] / 255;
    let g = data[i + 1] / 255;
    let b = data[i + 2] / 255;

    let [h, s, v] = rgbToHsv(r, g, b);

    // Posterize
    h = Math.round(h / factor) * factor;
    s = Math.round(s / factor) * factor;
    //v = Math.round(v / factor) * factor;
    v = 0.7;
    // Convert back to RGB
    const i2 = Math.floor(h * 6);
    const f = h * 6 - i2;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);

    switch (i2 % 6) {
      case 0:
        (r = v), (g = t), (b = p);
        break;
      case 1:
        (r = q), (g = v), (b = p);
        break;
      case 2:
        (r = p), (g = v), (b = t);
        break;
      case 3:
        (r = p), (g = q), (b = v);
        break;
      case 4:
        (r = t), (g = p), (b = v);
        break;
      case 5:
        (r = v), (g = p), (b = q);
        break;
    }

    data[i] = r * 255;
    data[i + 1] = g * 255;
    data[i + 2] = b * 255;
    // Alpha channel remains unchanged
  }
}

function posterizeYCbCr(imageData: ImageData, levels: number): void {
  const data = imageData.data;
  const factor = 255 / (levels - 1);

  for (let i = 0; i < data.length; i += 4) {
    // Convert to YCbCr
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    let y = 0.299 * r + 0.587 * g + 0.114 * b;
    let cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
    let cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;

    // Posterize
    y = Math.round(y / factor) * factor;
    cb = Math.round(cb / factor) * factor;
    cr = Math.round(cr / factor) * factor;

    // Convert back to RGB
    r = y + 1.402 * (cr - 128);
    g = y - 0.34414 * (cb - 128) - 0.71414 * (cr - 128);
    b = y + 1.772 * (cb - 128);

    // Clamp values
    r = Math.max(0, Math.min(255, r));
    g = Math.max(0, Math.min(255, g));
    b = Math.max(0, Math.min(255, b));

    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
    // Alpha channel remains unchanged
  }
}

function posterize(imageData: ImageData, levels: number): void {
  const data = imageData.data;
  const factor = 255 / (levels - 1);

  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.round(data[i] / factor) * factor; // Red
    data[i + 1] = Math.round(data[i + 1] / factor) * factor; // Green
    data[i + 2] = Math.round(data[i + 2] / factor) * factor; // Blue
    // Alpha channel remains unchanged
  }
}

function medianBlur(imageData: ImageData): void {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;

  function getMedian(arr: number[]) {
    const sortedArr = arr.slice().sort((a, b) => a - b);
    const mid = Math.floor(sortedArr.length / 2);
    return sortedArr.length % 2 !== 0
      ? sortedArr[mid]
      : (sortedArr[mid - 1] + sortedArr[mid]) / 2;
  }

  function getNeighbors(x: number, y: number) {
    const neighbors = [];
    for (let dx = -1; dx <= 2; dx++) {
      for (let dy = -1; dy <= 2; dy++) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          const index = (ny * width + nx) * 4;
          neighbors.push(data[index]);
        }
      }
    }
    return neighbors;
  }

  const filteredData = new Uint8ClampedArray(data.length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;
      const neighbors = getNeighbors(x, y);
      filteredData[index + 2] =
        filteredData[index + 1] =
        filteredData[index] =
          getMedian(neighbors);
      filteredData[index + 3] = data[index + 3];
    }
  }

  return imageData.data.set(filteredData);
}

function threshold_internal(pixels: ImageData, threshold: number): void {
  const data = pixels.data;

  for (let i = 0; i < data.length; i += 4) {
    const value = data[i] > threshold ? 255 : 0;
    data[i] = data[i + 1] = data[i + 2] = value;
  }
}

function dilation_internal(pixels: ImageData): void {
  const data = pixels.data;
  const w = pixels.width * 4;
  const l = data.length - w - 4;
  const buff = new Uint8ClampedArray(data.length);

  for (let i = w + 4; i < l; i += 4) {
    const max = Math.max(
      data[i - w - 4],
      data[i - 4],
      data[i + w - 4],
      data[i - w],
      data[i],
      data[i + w],
      data[i - w + 4],
      data[i + 4],
      data[i + w + 4]
    );
    buff[i] = buff[i + 1] = buff[i + 2] = max;
    buff[i + 3] = 255;
  }
  pixels.data.set(buff);
}

function houghLineTransform(pixels: ImageData, threshold: number): number[][] {
  const data = pixels.data;
  const width = pixels.width;
  const height = pixels.height;
  const maxDist = Math.sqrt(width * width + height * height);
  const accumulator = [];

  // Initialize the accumulator
  for (let i = 0; i <= 180; i++) {
    const array = [];
    for (let j = 0; j <= maxDist; j++) {
      array.push(0);
    }
    accumulator.push(array);
  }

  // Loop through each pixel in the image
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = 4 * (y * width + x);
      // If the pixel is part of an edge
      if (data[idx] > threshold) {
        // Calculate the distance and angle for each line that could pass through this point
        for (let theta = 0; theta <= 180; theta++) {
          const thetaRad = (theta * Math.PI) / 180;
          const dist = Math.abs(
            x * Math.cos(thetaRad) + y * Math.sin(thetaRad)
          );
          accumulator[theta][Math.floor(dist)]++;
        }
      }
    }
  }

  return accumulator;
}

function findDominantLine(accumulator: number[][]) {
  let maxCount = 0;
  let dominantLine = { theta: 0, dist: 0 };

  for (let theta = 0; theta < accumulator.length; theta++) {
    for (let dist = 0; dist < accumulator[theta].length; dist++) {
      if (accumulator[theta][dist] > maxCount) {
        maxCount = accumulator[theta][dist];
        dominantLine = { theta: theta, dist: dist };
      }
    }
  }

  return dominantLine;
}

function rgbToYCbCr(r: number, g: number, b: number): number[] {
  // Convert to YCbCr
  const y = 0.299 * r + 0.587 * g + 0.114 * b;
  const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
  const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;

  // Ensure values are within the valid range (0 to 255)
  const yCbCrValues = [clamp(y, 0, 255), clamp(cb, 0, 255), clamp(cr, 0, 255)];

  return yCbCrValues;
}

function rgbToHsv(r: number, g: number, b: number): number[] {
  (r /= 255), (g /= 255), (b /= 255);

  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h = 0;
  const v = max;

  const d = max - min;
  const s = max == 0 ? 0 : d / max;

  if (max == min) {
    h = 0; // achromatic
  } else {
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }

    h /= 6;
  }

  return [(h * 360) / 2, s * 255, v * 255];
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, max));
}

/**
 * @param data - input pixels data
 * @param idx - the index of the central pixel
 * @param w - image width (width*4 in case of RGBA)
 * @param m - the gradient mask (for Sobel=[1, 2, 1])
 */
function conv3x(
  data: Uint8ClampedArray,
  idx: number,
  w: number,
  m: number[]
): number {
  return (
    m[0] * data[idx - w - 4] +
    m[1] * data[idx - 4] +
    m[2] * data[idx + w - 4] -
    m[0] * data[idx - w + 4] -
    m[1] * data[idx + 4] -
    m[2] * data[idx + 4 + 4]
  );
}

function conv3y(
  data: Uint8ClampedArray,
  idx: number,
  w: number,
  m: number[]
): number {
  return (
    m[0] * data[idx - w - 4] +
    m[1] * data[idx - w] +
    m[2] * data[idx - w + 4] -
    (m[0] * data[idx + w - 4] + m[1] * data[idx + w] + m[2] * data[idx + w + 4])
  );
}

function conv9(
  data: Uint8ClampedArray,
  idx: number,
  w: number,
  m: number[]
): number {
  return (
    m[0] * data[idx - w - 4] +
    m[1] * data[idx - w] +
    m[2] * data[idx - w + 4] +
    m[3] * data[idx - 4] +
    m[4] * data[idx] +
    m[5] * data[idx + 4] +
    m[6] * data[idx + w - 4] +
    m[7] * data[idx + w] +
    m[8] * data[idx + w + 4]
  );
}

// return grayscale value of pixel, idx is the red channel
// give bias towards skin color (for skin detection)
// get_pixel_value
function gpv(data: Uint8ClampedArray, idx: number): number {
  const r = data[idx];
  const g = data[idx + 1];
  const b = data[idx + 2];
  const gray = Math.round(0.2989 * r + 0.587 * g + 0.114 * b);
  const rgratio = r / g;
  const sigmarg = 0.75;
  const meanrg = 1.6;

  const exponent = -(
    Math.pow(rgratio - meanrg, 2) /
    (2 * Math.pow(sigmarg, 2))
  );
  const probability = Math.exp(exponent);
  const skinProbability = probability;

  return Math.max(
    Math.min(Math.round(gray - 30 + 2 * skinProbability * 90), 255),
    0
  );
}

function grayscale(pixels: ImageData): void {
  const data = pixels.data;
  const l = data.length;
  const buff = new Uint8ClampedArray(data.length);
  for (let i = 0; i < l; i += 4) {
    const v = gpv(data, i);
    buff[i] = buff[i + 1] = buff[i + 2] = v;
    buff[i + 3] = 255;
  }
  pixels.data.set(buff);
}

/**
 * @param pixels - Object of image parameters
 * @param mask - gradient operator e.g. Prewitt, Sobel, Scharr, etc.
 */
function gradient_internal(pixels: ImageData, mask: number[]): void {
  const data = pixels.data;
  const w = pixels.width * 4;
  const l = data.length - w - 4;
  const buff = new Uint8ClampedArray(data.length);

  for (let i = w + 4; i < l; i += 4) {
    const dx = conv3x(data, i, w, mask);
    const dy = conv3y(data, i, w, mask);
    buff[i] = buff[i + 1] = buff[i + 2] = Math.sqrt(dx * dx + dy * dy);
    buff[i + 3] = 255;
  }
  pixels.data.set(buff);
}

function blur(pixels: ImageData, conv: number[]): void {
  const data = pixels.data;
  const w = pixels.width * 4;
  const l = data.length - w - 4;
  const buff = new Uint8ClampedArray(data.length);

  for (let i = w + 4; i < l; i += 4) {
    const dx = conv9(data, i, w, conv);
    buff[i] = buff[i + 1] = buff[i + 2] = dx / 16;
    buff[i + 3] = 255;
  }
  pixels.data.set(buff);
}

interface ProcessingResult {
  lefts: number[][];
  rights: number[][];
  distances: number[];
}

@Component({
  selector: 'app-custom-wrist-size-model',
  templateUrl: './custom-wrist-size-model.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomWristSizeModelComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  @ViewChild('videoElement')
  public videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('outputCanvas')
  public outputCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('processingCanvas')
  public processingCanvas?: ElementRef<HTMLCanvasElement>;

  public gestureDetected = '';
  public showLandmarks = false;
  public medianBlur = false;
  public skinGrayscale = true;
  public edgeDetect = false;
  public posterize = false;
  public gaussianMixture = true;
  public skinFilter = false;
  public cameras$ = this.cameraService.getCameras$();
  public selectedCamera?: MediaDeviceInfo;
  public mirrorWebcam = true;

  private gestureRecognizer?: HandLandmarker;
  private runningMode?: 'VIDEO' | 'IMAGE' = 'VIDEO';
  private lastVideoTime = -1;
  private results?: HandLandmarkerResult;
  private lastDetectionTime = 0;
  private classifier?: MultinomialNB | GaussianNB | KNN;
  private classifierCache = new Map<number[], number>();
  private refocusClassifier = false;
  private subscriptions: Subscription[] = [];
  private animationFrameId?: number;
  private onDataLoaded = () => {
    this.predictWebcam(this.selectedCamera?.deviceId);
  };

  public constructor(
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

  public async ngAfterViewInit(): Promise<void> {
    console.log('Creating gesture recognizer');
    this.createGestureRecognizer().then(() => {
      const videoElement = this.videoElement.nativeElement;

      this.cameraService.enableCameraForVideoElement(videoElement, () => {
        this.onDataLoaded();
      });
    });
  }

  public ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  public onSelectedCameraChange(): void {
    this.cameraService.setSelectedCamera(this.selectedCamera);
    this.cameraService.enableCameraForVideoElement(
      this.videoElement.nativeElement,
      this.onDataLoaded
    );
  }

  public async imageUploaded(event: any): Promise<void> {
    console.log('Image uploaded called!');
    const image = new Image();
    image.src = URL.createObjectURL(event.target.files[0]);

    if (!this.processingCanvas?.nativeElement) return;

    if (this.gestureRecognizer && this.runningMode != 'IMAGE') {
      await this.gestureRecognizer.setOptions({
        runningMode: 'IMAGE',
      });
      this.runningMode = 'IMAGE';
    }
    image.onload = () => {
      if (this.gestureRecognizer) {
        this.results = this.gestureRecognizer.detect(image);
      }
      if (!this.outputCanvas?.nativeElement) return;
      this.drawAndProcessImage(
        image,
        this.processingCanvas!.nativeElement,
        this.processingCanvas!.nativeElement
      );
    };
  }

  private leastSquares(points: any[]) {
    let x = 0;
    let y = 0;
    let xy = 0;
    let x2 = 0;
    const n = points.length;
    for (const point of points) {
      x += point[0];
      y += point[1];
      xy += point[0] * point[1];
      x2 += point[0] * point[0];
    }
    const m = (n * xy - x * y) / (n * x2 - x * x);
    const b = (y - m * x) / n;
    return [0, b, points[0][0], points[0][0] * m + b];
  }

  private enableCamera(): void {
    const videoElement = this.videoElement?.nativeElement;
    console.log('Asking for camera');
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

  public async predict(image: HTMLImageElement): Promise<number> {
    if (!this.gestureRecognizer || !this.processingCanvas?.nativeElement)
      return NaN;
    this.results = this.gestureRecognizer.detect(image);
    const pCanvas = this.processingCanvas.nativeElement;
    pCanvas.width = image.width;
    pCanvas.height = image.height;

    const pCtx = pCanvas.getContext('2d');
    if (!pCtx) return NaN;
    pCtx.drawImage(image, 0, 0, pCanvas.width, pCanvas.height);

    // Read the pixels from the canvas
    const imageData = pCtx.getImageData(0, 0, pCanvas.width, pCanvas.height);
    this.preprocess(imageData, pCanvas);
    pCtx.putImageData(imageData!, 0, 0);
    const result = this.process(pCanvas, { display: false });

    if (result.length > 0) {
      return Math.sqrt(result[0].distances[0]);
    }
    return NaN;
  }

  // Apply operations to pixel image data and modify it in place
  public preprocess(imageData: ImageData, pCanvas: HTMLCanvasElement): void {
    const data = imageData.data;

    // Processing of image data
    if (this.posterize) posterizeYCbCr(imageData, 6);
    if (this.medianBlur) coloredMedianBlur(imageData);
    if (this.skinFilter) skinDetector(imageData);
    if (this.skinGrayscale) grayscale(imageData);
    const idxes = [];
    if (
      this.gaussianMixture &&
      this.results?.landmarks &&
      this.results.landmarks.length > 0
    ) {
      //let classifier = new NaiveBayes();
      //let model = new MultinomialNB();
      const model = this.classifier;
      if (
        !model ||
        this.refocusClassifier ||
        performance.now() - this.lastDetectionTime > 500
      ) {
        let skinPixels = [];
        const backgroundPixels = [];
        const landmarkNumbers = [0, 1, 5, 9, 13, 17];

        // Add pixel rgb values of keypoints to array
        for (
          let handNum = 0;
          handNum < this.results.landmarks.length;
          handNum++
        ) {
          //for (let i = 0; i < this.results.landmarks[handNum].length; i++) {
          for (let i = 0; i < landmarkNumbers.length; i++) {
            const landmark =
              this.results.landmarks[handNum][landmarkNumbers[i]];
            // landmark x and y are scaled from 0 to 1 depending on width/height
            // compute idx based on landmark x and y
            const x = Math.floor(landmark.x * pCanvas.width);
            const y = Math.floor(landmark.y * pCanvas.height);
            const idx = Math.floor(y * pCanvas.width + x) * 4;
            if (idx < data.length && data[idx]) {
              skinPixels.push([data[idx], data[idx + 1], data[idx + 2]]);
              idxes.push(idx);
            }
          }
        }

        // Add pixels along finger lines
        const lineLandmarks = [
          [0, 5],
          [0, 1],
          [9, 13],
        ];
        for (
          let handNum = 0;
          handNum < this.results.landmarks.length;
          handNum++
        ) {
          for (let i = 0; i < lineLandmarks.length; i++) {
            const wrist = this.results.landmarks[handNum][lineLandmarks[i][0]];
            const index = this.results.landmarks[handNum][lineLandmarks[i][1]];
            const ivec = index.x - wrist.x;
            const jvec = index.y - wrist.y;
            for (let dx = -0.3; dx < 0.8; dx += 0.05) {
              const x = Math.floor((wrist.x + dx * ivec) * pCanvas.width);
              const y = Math.floor((wrist.y + dx * jvec) * pCanvas.height);
              const idx = Math.floor(y * pCanvas.width + x) * 4;
              if (idx < data.length && data[idx]) {
                skinPixels.push([data[idx], data[idx + 1], data[idx + 2]]);
                idxes.push(idx);
              }
            }
          }
        }

        for (
          let handNum = 0;
          handNum < this.results.landmarks.length;
          handNum++
        ) {
          const candidates = [1, 2, 3, 4, 17, 18, 19, 20].map(
            (i) => this.results!.landmarks[handNum][i]
          );
          // find right-most and left-most x coordinate
          const rightMost = candidates.reduce(
            (a, c, i) => (c.x > 0 && c.x > a.x ? c : a),
            { x: -1, y: -1 }
          );
          const leftMost = candidates.reduce(
            (a, c, i) => (c.x > 0 && c.x < a.x ? c : a),
            { x: 2, y: 2 }
          );

          const ref: number =
            this.results!.landmarks[handNum][0].y -
            this.results!.landmarks[handNum][5].y;
          const ivec: number =
            this.results!.landmarks[handNum][0].x -
            this.results!.landmarks[handNum][9].x;
          // Draw vertical line away from leftmost
          for (let dy = 0.2; dy < 1; dy += 0.05) {
            const nx =
              Math.floor((leftMost.x + ivec * dy) * pCanvas.width) - 15;
            const ny = Math.floor((leftMost.y + ref * dy) * pCanvas.height);
            const idx = Math.floor(ny * pCanvas.width + nx) * 4;
            if (idx < data.length && data[idx]) {
              backgroundPixels.push([data[idx], data[idx + 1], data[idx + 2]]);
              idxes.push(idx);
            }
          }
          // Draw vertical line away from rightmost
          for (let dy = 0.2; dy < 1; dy += 0.05) {
            const nx =
              Math.floor((rightMost.x + ivec * dy) * pCanvas.width) + 15;
            const ny = Math.floor((rightMost.y + ref * dy) * pCanvas.height);
            const idx = Math.floor(ny * pCanvas.width + nx) * 4;
            if (idx < data.length && data[idx]) {
              backgroundPixels.push([data[idx], data[idx + 1], data[idx + 2]]);
              idxes.push(idx);
            }
          }
        }

        /*
            const lineLandmarks2 = [[4, 8]];
            // add background pixels by going above and below the wrist-index finger line
            for (let handNum = 0; handNum < this.results.landmarks.length; handNum++) {
                for (let i = 0; i < lineLandmarks2.length; i++) {
                    const i1 = this.results.landmarks[handNum][lineLandmarks2[i][0]];
                    const i2 = this.results.landmarks[handNum][lineLandmarks2[i][1]];
                    const ivec = i2.x - i1.x;
                    const jvec = i2.y - i1.y;
                    const i3 = this.results.landmarks[handNum][lineLandmarks2[i][0] - 1];
                    const iref = i3.x - i1.x;
                    const jref = i3.y - i1.y;
                    const distV = Math.sqrt(ivec * ivec + jvec * jvec);
                    const distRef = Math.sqrt(iref * iref + jref * jref);

                    if (distV / distRef < 2) continue;
                    const offsetX = distV / distRef < 3 ? 0.2 : 0.35;
                    for (let dx = offsetX; dx < 0.4; dx += 0.05) {
                        const x = Math.floor((i1.x + dx * ivec) * pCanvas.width);
                        const y = Math.floor((i1.y + dx * jvec) * pCanvas.height);
                        const idx = Math.floor(y * pCanvas.width + x) * 4;
                        if (idx < data.length && data[idx]) {
                            backgroundPixels.push([data[idx], data[idx + 1], data[idx + 2]]);
                            idxes.push(idx);
                        }
                    }
                }
            }*/

        // TODO: add constant background sample
        //backgroundPixels = backgroundPixels.concat([[0, 0, 0], [255, 255, 255], [72, 92, 85], [131, 168, 155], [190, 244, 225], [48, 67, 60], [76, 105, 94], [85, 101, 85]]);
        skinPixels = skinPixels.map(([r, g, b]) =>
          rgbToYCbCr(r, g, b).slice(1)
        );
        const Xtrain = skinPixels.concat(
          backgroundPixels.map(([r, g, b]) => rgbToYCbCr(r, g, b).slice(1))
        );
        //Xtrain = Xtrain.map(([r, g, b]) => rgbToYCbCr(r, g, b).slice(1));
        const Ytrain = Array(skinPixels.length)
          .fill(1)
          .concat(Array(backgroundPixels.length).fill(0));
        this.classifier = new KNN(Xtrain, Ytrain, { k: 3 });
        this.classifierCache.clear();
        // check quality of sample, and restart if necessary
        const r: number[] = this.classifier.predict(skinPixels);
        if (r.filter((v) => v != 1).length > 3) this.refocusClassifier = true;
        else this.refocusClassifier = false;
      }
      //model.train(Xtrain, Ytrain);
      //classifier.train([[0, 0, 0], [255, 255, 255], [72, 92, 85], [131, 168, 155], [190, 244, 225]], skinPixels);
      // classifier.train(skinPixels, [[0, 0, 0], [255, 255, 255], [72, 92, 85], [131, 168, 155], [190, 244, 225]].concat(backgroundPixels));

      naiveBayesClassifier(imageData!, {
        predict: (input) => {
          if (!this.classifierCache.has(input[0])) {
            const result = this.classifier.predict(input);
            this.classifierCache.set(input[0], result);
            return result;
          }
          return this.classifierCache.get(input[0]);
        },
      });
      // Perform morphological operations ('closing')
      dilation_internal(imageData);
      //erosion_internal(imageData);

      idxes.forEach((idx) => {
        data[idx] = 255;
        data[idx + 1] = 0;
        data[idx + 2] = 0;
        data[idx + 3] = 255;
      });
      //separateArmAndBackground(imageData!, skinPixels, []);
    }

    if (this.edgeDetect) gradient_internal(imageData!, [1, 2, 1]);
    // Example to threshold
    //threshold_internal(imageData, 90);
  }

  public process(
    pCanv: HTMLCanvasElement,
    drawingOpts: {
      displayCanv?: HTMLCanvasElement | undefined;
      display?: boolean;
      scaleFactor?: number;
    }
  ): ProcessingResult[] {
    drawingOpts = Object.assign(
      { displayCanv: undefined, display: false, scaleFactor: 1 },
      drawingOpts
    );
    drawingOpts.scaleFactor = <number>drawingOpts.scaleFactor;
    const imageData = pCanv
      .getContext('2d')
      ?.getImageData(0, 0, pCanv.width, pCanv.height);
    const canvas = drawingOpts.displayCanv || pCanv;
    const canvasCtx = canvas?.getContext('2d');
    if (!canvasCtx) throw new Error('Could not get processingCanv 2d context');
    if (!imageData)
      throw new Error('Could not get imageData from processingCanv');

    if (drawingOpts.display) {
      if (!drawingOpts.displayCanv)
        throw new Error('displayCanv must be defined if display is true');
      if (!canvasCtx) throw new Error('Could not get displayCanv 2d context');
    }

    const results = [];
    if (this.results?.landmarks && this.results.landmarks.length > 0) {
      for (
        let handNum = 0;
        handNum < this.results.landmarks.length;
        handNum++
      ) {
        const wrist = this.results.landmarks[handNum][0];
        const diagonal = this.results.landmarks[handNum][5];
        const pinkymcp = this.results.landmarks[handNum][17];
        let maxDistanceCutoff =
          1.2 * Math.pow((pinkymcp.x - diagonal.x) * pCanv.width, 2) +
          Math.pow((pinkymcp.y - diagonal.y) * pCanv.height, 2) +
          Math.pow((pinkymcp.z - diagonal.z) * 100, 2);
        maxDistanceCutoff = Math.max(
          maxDistanceCutoff,
          0.6 * Math.pow((diagonal.x - wrist.x) * pCanv.width, 2) +
            Math.pow((diagonal.y - wrist.y) * pCanv.height, 2) +
            Math.pow((diagonal.z - wrist.z) * 100, 2)
        );

        if (drawingOpts.display) {
          // draw a line from wrist to diagonal
          canvasCtx.beginPath();
          canvasCtx.moveTo(wrist.x * canvas.width, wrist.y * canvas.height);
          canvasCtx.lineTo(
            diagonal.x * canvas.width,
            diagonal.y * canvas.height
          );
          canvasCtx.lineWidth = 5;
          canvasCtx.strokeStyle = 'red';
          canvasCtx.stroke();
        }

        // calculate vector
        const ivec = wrist.x - diagonal.x;
        const jvec = wrist.y - diagonal.y;

        // calculate ortgohonal i and j vector
        const iort = -jvec;
        const jort = ivec;

        // Sample points from the line equation
        const points = [];

        points.push({
          x: Math.floor(wrist.x * pCanv.width),
          y: Math.floor(wrist.y * pCanv.height),
        });
        //for (let dx = 0; dx < 0.6; dx += 0.1) {
        //    points.push({ x: Math.floor((wrist.x + dx * ivec) * pCanv.width), y: Math.floor((wrist.y + dx * jvec) * pCanv.height)});
        //}

        let lefts = [];
        let rights = [];
        const distances = [];
        // draw points
        for (const point of points) {
          // find edges from orthogonal ray centered at point using imageData
          let edgeLeft = [0, 0];
          for (let delta = 0.05; delta < 0.5; delta += 0.05) {
            const nx = Math.floor(point.x - delta * iort * pCanv.width);
            const ny = Math.floor(point.y - delta * jort * pCanv.height);
            if (nx < 0 || ny < 0 || nx > pCanv.width || ny > pCanv.height)
              break;
            const idx = Math.floor(ny * pCanv.width + nx) * 4;

            if (imageData.data![idx] < 90) {
              edgeLeft = [
                point.x - delta * iort * pCanv.width,
                point.y - delta * jort * pCanv.height,
              ];
              break;
            }
          }

          // find right edges from orthogonal ray centered at point using imageData
          let edgeRight = [0, 0];
          for (let delta = 0.05; delta < 0.5; delta += 0.05) {
            const nx = Math.floor(point.x + delta * iort * pCanv.width);
            const ny = Math.floor(point.y + delta * jort * pCanv.height);
            if (nx < 0 || ny < 0 || nx > pCanv.width || ny > pCanv.height)
              break;
            const idx = Math.floor(ny * pCanv.width + nx) * 4;
            if (imageData.data![idx] < 90) {
              edgeRight = [
                point.x + delta * iort * pCanv.width,
                point.y + delta * jort * pCanv.height,
              ];
              break;
            }
          }

          if (drawingOpts.display) {
            // draw point
            canvasCtx.beginPath();
            canvasCtx.arc(
              point.x * drawingOpts.scaleFactor,
              point.y * drawingOpts.scaleFactor,
              5,
              0,
              2 * Math.PI,
              false
            );
            canvasCtx.fillStyle = 'red';
            canvasCtx.fill();
            canvasCtx.lineWidth = 4;
            canvasCtx.strokeStyle = '#003300';
            canvasCtx.stroke();
          }

          if (edgeLeft[0] == 0 || edgeRight[0] == 0) continue;

          if (drawingOpts.display) {
            // draw line from left to right
            canvasCtx.beginPath();
            canvasCtx.moveTo(
              edgeLeft[0] * drawingOpts.scaleFactor,
              edgeLeft[1] * drawingOpts.scaleFactor
            );
            canvasCtx.lineTo(
              edgeRight[0] * drawingOpts.scaleFactor,
              edgeRight[1] * drawingOpts.scaleFactor
            );
            canvasCtx.lineWidth = 5;
            canvasCtx.strokeStyle = 'green';
            canvasCtx.stroke();
          }

          lefts.push(edgeLeft);
          rights.push(edgeRight);

          const distancesqr =
            Math.pow(edgeLeft[0] - edgeRight[0], 2) +
            Math.pow(edgeLeft[1] - edgeRight[1], 2);
          distances.push(distancesqr);
        }

        if (distances.length > 0) {
          // remove outliers and distances over maximum reasonable size
          const median = distances.sort()[Math.floor(distances.length / 2)];
          const filteredLefts = [];
          const filteredRights = [];
          for (let i = 0; i < distances.length; i++) {
            if (
              distances[i] < median * 2 &&
              distances[i] > median / 2 &&
              distances[i] < maxDistanceCutoff
            ) {
              filteredLefts.push(lefts[i]);
              filteredRights.push(rights[i]);
            }
          }
          lefts = filteredLefts;
          rights = filteredRights;
        }

        const pointsOfLines = [lefts, rights];
        // draw line through lefts
        for (const linePoints of pointsOfLines) {
          if (linePoints.length < 2) continue;
          const fittedLine = this.leastSquares(linePoints);

          if (drawingOpts.display) {
            // draw blue dot for every left
            for (const p of linePoints) {
              canvasCtx.beginPath();
              canvasCtx.arc(
                p[0] * drawingOpts.scaleFactor,
                p[1] * drawingOpts.scaleFactor,
                3,
                0,
                2 * Math.PI,
                false
              );
              canvasCtx.fillStyle = 'blue';
              canvasCtx.fill();
            }

            canvasCtx.beginPath();
            canvasCtx.moveTo(
              fittedLine[0] * drawingOpts.scaleFactor,
              fittedLine[1] * drawingOpts.scaleFactor
            );
            canvasCtx.lineTo(
              fittedLine[2] * drawingOpts.scaleFactor,
              fittedLine[3] * drawingOpts.scaleFactor
            );
            canvasCtx.lineWidth = 4;
            canvasCtx.strokeStyle = 'blue';
            canvasCtx.stroke();
          }
        }

        results.push({ lefts, rights, distances });
      }
    }
    return results;
  }

  public drawAndProcessImage(
    image: HTMLVideoElement | HTMLImageElement,
    pCanvas: HTMLCanvasElement,
    displayCanv: HTMLCanvasElement
  ) {
    const scaleFactor = 3;

    let width, height;
    if (image instanceof HTMLVideoElement) {
      width = Math.floor(image.videoWidth) / scaleFactor;
      height = Math.floor(image.videoHeight) / scaleFactor;
    } else {
      width = Math.floor(image.width) / scaleFactor;
      height = Math.floor(image.height) / scaleFactor;
    }

    if (pCanvas.width != width || pCanvas.height != height) {
      pCanvas.width = width;
      pCanvas.height = height;
      pCanvas.style.width = pCanvas.width + 'px';
      pCanvas.style.height = pCanvas.height + 'px';
    }

    const pCtx = pCanvas.getContext('2d');
    if (!pCtx) return;
    pCtx.drawImage(image, 0, 0, pCanvas.width || 0, pCanvas.height || 0);

    // Read the pixels from the canvas
    const imageData = pCtx.getImageData(
      0,
      0,
      pCanvas.clientWidth || 0,
      pCanvas.clientHeight || 0
    );
    this.preprocess(imageData, pCanvas);
    pCtx.putImageData(imageData, 0, 0);

    const canvasCtx = displayCanv.getContext('2d');
    if (!canvasCtx) return;
    const canvas = displayCanv;
    this.process(pCanvas, { displayCanv: canvas, display: true, scaleFactor });
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
  }

  private async predictWebcam(currentCameraId?: string): Promise<void> {
    const video = this.videoElement?.nativeElement;
    const canvas = this.outputCanvas?.nativeElement;
    const canvasCtx = canvas?.getContext('2d');
    const selectedCameraId = this.selectedCamera?.deviceId;

    if (!video || !canvas || !canvasCtx || !this.gestureRecognizer) {
      return;
    }

    if (selectedCameraId !== currentCameraId) {
      return;
    }

    if (this.runningMode != 'VIDEO') {
      await this.gestureRecognizer.setOptions({
        runningMode: 'VIDEO',
      });
      this.runningMode = 'VIDEO';
    }
    canvas.style.width = video.videoWidth.toString();
    canvas.style.height = video.videoHeight.toString();
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const startTimeMs = performance.now();
    if (this.lastVideoTime !== video.currentTime) {
      this.lastVideoTime = video.currentTime;
      this.lastDetectionTime = startTimeMs;
      this.results = this.gestureRecognizer.detectForVideo(video, startTimeMs);
    }

    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
    const pCanvas = this.processingCanvas?.nativeElement;
    if (!pCanvas) return;

    this.drawAndProcessImage(video, pCanvas, canvas);
    canvasCtx.restore();
    this.cdr.detectChanges();

    this.animationFrameId = requestAnimationFrame(() =>
      this.predictWebcam(currentCameraId)
    );
  }

  private async createGestureRecognizer(): Promise<void> {
    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
    );
    this.gestureRecognizer = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
        delegate: 'GPU',
      },
      runningMode: this.runningMode,
      numHands: 2,
    });
  }
}
