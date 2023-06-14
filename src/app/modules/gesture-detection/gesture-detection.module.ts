import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { SharedModule } from 'src/app/shared/modules/shared.module';

import { GestureDetectionCustomComponent } from './gesture-detection-custom/gesture-detection-custom.component';
import { GestureDetectionHomeComponent } from './gesture-detection-home/gesture-detection-home.component';
import { GestureDetectionImplementationComponent } from './gesture-detection-implementation/gesture-detection-implementation.component';
import { GestureDetectionOutletComponent } from './gesture-detection-outlet.component';

const routes: Routes = [
  {
    path: '',
    component: GestureDetectionOutletComponent,
    children: [
      {
        path: 'home',
        data: { pageTitle: 'Gesture detection' },
        component: GestureDetectionHomeComponent,
      },
      {
        path: 'implementation',
        data: { pageTitle: 'Gesture detection implementation' },
        component: GestureDetectionImplementationComponent,
      },
      {
        path: 'custom',
        data: { pageTitle: 'Gesture detection custom' },
        component: GestureDetectionCustomComponent,
      },
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full',
      },
    ],
  },
];

@NgModule({
  declarations: [
    GestureDetectionOutletComponent,
    GestureDetectionHomeComponent,
    GestureDetectionImplementationComponent,
    GestureDetectionCustomComponent,
  ],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class GestureDetectionModule {}
