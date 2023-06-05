import { NgModule } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { MenubarModule } from 'primeng/menubar';

const primeNGModules = [ButtonModule, MenubarModule];

@NgModule({
  imports: [...primeNGModules],
  exports: [...primeNGModules],
})
export class PrimeNGModule {}
