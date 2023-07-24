import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { SharedModule } from 'src/app/shared/modules/shared.module';

import { MediaPipeImplementationsOutletComponent } from './media-pipe-implementations-outlet.component';
import { CustomGesturesComponent } from './modules/custom-gestures/custom-gestures.component';
import { SelfieSegmentationComponent } from './modules/selfie-segmentation/selfie-segmentation.component';
import { SelfieSegmentationAndHandDetectionComponent } from './modules/selfie-segmentation-and-hand-detection/selfie-segmentation-and-hand-detection.component';
import { StockGesturesComponent } from './modules/stock-gestures/stock-gestures.component';
import { StockHandDetectionComponent } from './modules/stock-hand-detection/stock-hand-detection.component';
import { HandLandmarkerService } from './services/hand-landmarker/hand-landmarker.service';

const routes: Routes = [
  {
    path: '',
    component: MediaPipeImplementationsOutletComponent,
    children: [
      {
        path: 'stock-gestures',
        data: { pageTitle: 'Stock gestures' },
        component: StockGesturesComponent,
      },
      {
        path: 'custom-gestures',
        data: { pageTitle: 'Custom gestures' },
        component: CustomGesturesComponent,
      },
      {
        path: 'selfie-segmentation',
        data: { pageTitle: 'Selfie segmentation' },
        component: SelfieSegmentationComponent,
      },
      {
        path: 'stock-hand-detection',
        data: { pageTitle: 'Stock hand detection' },
        component: StockHandDetectionComponent,
      },
      {
        path: 'selfie-segmentation-and-hand-detection',
        data: { pageTitle: 'Stock hand detection' },
        component: SelfieSegmentationAndHandDetectionComponent,
      },
      {
        path: '',
        redirectTo: 'stock-gestures',
        pathMatch: 'full',
      },
    ],
  },
];

@NgModule({
  providers: [HandLandmarkerService],
  declarations: [
    MediaPipeImplementationsOutletComponent,
    StockGesturesComponent,
    CustomGesturesComponent,
    SelfieSegmentationComponent,
    StockHandDetectionComponent,
    SelfieSegmentationAndHandDetectionComponent,
  ],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class MediaPipeImplementationsModule {}
