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
        path: 'media-pipe-implementations',
        loadChildren: () =>
          import(
            './modules/media-pipe-implementations/media-pipe-implementations.module'
          ).then((m) => m.MediaPipeImplementationsModule),
      },
      {
        path: '',
        redirectTo: 'media-pipe-implementations',
        pathMatch: 'full',
      },
      {
        path: '**',
        redirectTo: 'media-pipe-implementations',
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
