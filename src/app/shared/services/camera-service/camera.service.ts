import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CameraService {
  private cameras = new BehaviorSubject<MediaDeviceInfo[]>([]);
  private selectedCamera = new BehaviorSubject<MediaDeviceInfo | undefined>(
    undefined
  );

  constructor() {
    this.getListOfCameras();
  }

  /**
   * The function getListOfCameras retrieves a list of available
   * cameras and sets the first camera as the selected camera.
   */
  public getListOfCameras(): void {
    const cameras: MediaDeviceInfo[] = [];

    navigator.mediaDevices.enumerateDevices().then((devices) => {
      devices.forEach((device) => {
        if (device.kind === 'videoinput') {
          cameras.push(device);
        }
      });

      this.cameras.next(cameras);
      this.selectedCamera.next(cameras[0]);
    });
  }

  public enableCameraForVideoElement(
    videoElement: HTMLVideoElement,
    onDataLoaded: () => void
  ): void {
    // Remove existing stream and listeners
    if (videoElement.srcObject) {
      videoElement.onloadeddata = null;
      videoElement.srcObject = null;
    }

    navigator.mediaDevices
      .getUserMedia({
        video: {
          deviceId: this.selectedCamera.value?.deviceId,
        },
        audio: false,
      })
      .then((stream) => {
        videoElement.onloadeddata = () => {
          onDataLoaded();
        };
        videoElement.srcObject = stream;
      })
      .catch((error) => {
        console.error(error);
      });
  }

  public getCameras$(): Observable<MediaDeviceInfo[]> {
    return this.cameras.asObservable();
  }

  public getSelectedCamera$(): Observable<MediaDeviceInfo | undefined> {
    return this.selectedCamera.asObservable();
  }

  public setSelectedCamera(camera?: MediaDeviceInfo): void {
    this.selectedCamera.next(camera);
  }
}
