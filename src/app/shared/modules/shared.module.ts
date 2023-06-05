import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { PrimeNGModule } from './primeng.module';

@NgModule({
  imports: [CommonModule, PrimeNGModule],
  exports: [CommonModule, FormsModule, ReactiveFormsModule, PrimeNGModule],
})
export class SharedModule {}
