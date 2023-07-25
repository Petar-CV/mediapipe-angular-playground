import { NgModule } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { InputSwitchModule } from 'primeng/inputswitch';
import { MenubarModule } from 'primeng/menubar';

const primeNGModules = [
  ButtonModule,
  MenubarModule,
  DropdownModule,
  InputSwitchModule,
];

@NgModule({
  exports: [...primeNGModules],
})
export class PrimeNGModule {}
