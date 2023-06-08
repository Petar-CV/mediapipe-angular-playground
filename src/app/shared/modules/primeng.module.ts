import { NgModule } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { MenubarModule } from 'primeng/menubar';

const primeNGModules = [ButtonModule, MenubarModule, CheckboxModule];

@NgModule({
  exports: [...primeNGModules],
})
export class PrimeNGModule {}
