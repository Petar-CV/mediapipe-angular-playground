import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { MainContentComponent } from './main-layout/main-content/main-content.component';
import { MainNavbarComponent } from './main-layout/main-navbar/main-navbar.component';
import { SharedModule } from '../modules/shared.module';

@NgModule({
  declarations: [MainContentComponent, MainNavbarComponent],
  imports: [CommonModule, SharedModule, RouterModule.forChild([])],
  exports: [MainContentComponent, MainNavbarComponent],
})
export class LayoutModule {}
