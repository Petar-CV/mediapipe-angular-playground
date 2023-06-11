import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { MainContentComponent } from './shared/components/main-layout/main-content/main-content.component';

const routes: Routes = [
  {
    path: '',
    component: MainContentComponent,
    data: { pageTitle: 'Home' },
    children: [
      {
        path: 'gesture-detection',
        loadChildren: () =>
          import('./modules/gesture-detection/gesture-detection.module').then(
            (m) => m.GestureDetectionModule
          ),
      },
      {
        path: '',
        redirectTo: 'gesture-detection',
        pathMatch: 'full',
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
