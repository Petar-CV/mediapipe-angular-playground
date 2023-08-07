import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  template: ` <router-outlet /> `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomModelsOutletComponent {}
