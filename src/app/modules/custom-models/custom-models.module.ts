import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { SharedModule } from 'src/app/shared/modules/shared.module';

import { CustomModelsOutletComponent } from './custom-models-outlet.component';
import { CustomWristSizeModelComponent } from './modules/custom-wrist-size-model/custom-wrist-size-model.component';

const routes: Routes = [
  {
    path: '',
    component: CustomModelsOutletComponent,
    children: [
      {
        path: 'custom-wrist-size',
        data: { pageTitle: 'Custom wrist size' },
        component: CustomWristSizeModelComponent,
      },
      {
        path: '',
        redirectTo: 'selfie-segmentation',
        pathMatch: 'full',
      },
    ],
  },
];

@NgModule({
  declarations: [CustomModelsOutletComponent, CustomWristSizeModelComponent],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class CustomModelsModule {}
