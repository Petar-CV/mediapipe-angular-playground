import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { SharedModule } from 'src/app/shared/modules/shared.module';

import { CustomGesturesComponent } from './custom-gestures/custom-gestures.component';
import { MediaPipeImplementationsOutletComponent } from './media-pipe-implementations-outlet.component';
import { SelfieSegmentationComponent } from './selfie-segmentation/selfie-segmentation.component';
import { SelfieSegmentationAndHandDetectionComponent } from './selfie-segmentation-and-hand-detection/selfie-segmentation-and-hand-detection.component';
import { StockGesturesComponent } from './stock-gestures/stock-gestures.component';
import { StockHandDetectionComponent } from './stock-hand-detection/stock-hand-detection.component';

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
