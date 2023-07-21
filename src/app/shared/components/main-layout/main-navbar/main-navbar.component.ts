import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-main-navbar',
  templateUrl: './main-navbar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainNavbarComponent implements OnInit {
  public navbarItems: MenuItem[] = [];

  constructor(private cdr: ChangeDetectorRef) {}

  public ngOnInit(): void {
    this.loadNavbar();
  }

  private loadNavbar(): void {
    this.navbarItems = [
      {
        label: 'Stock gestures',
        icon: 'pi pi-fw pi-play',
        routerLink: ['/media-pipe-implementations/stock-gestures'],
      },
      {
        label: 'Custom gestures',
        icon: 'pi pi-fw pi-play',
        routerLink: ['/media-pipe-implementations/custom-gestures'],
      },
      {
        label: 'Selfie segmentation',
        icon: 'pi pi-fw pi-play',
        routerLink: ['/media-pipe-implementations/selfie-segmentation'],
      },
      {
        label: 'Stock hand detection',
        icon: 'pi pi-fw pi-play',
        routerLink: ['/media-pipe-implementations/stock-hand-detection'],
      },
    ];

    this.cdr.markForCheck();
  }
}
