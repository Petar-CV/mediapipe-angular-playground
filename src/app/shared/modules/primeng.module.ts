import { NgModule } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DropdownModule } from 'primeng/dropdown';
import { MenubarModule } from 'primeng/menubar';

const primeNGModules = [
  ButtonModule,
  MenubarModule,
  CheckboxModule,
  DropdownModule,
];

@NgModule({
  exports: [...primeNGModules],
})
export class PrimeNGModule {}
