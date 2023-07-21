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
        label: 'Home',
        icon: 'pi pi-fw pi-home',
        routerLink: ['/'],
        routerLinkActiveOptions: { exact: true },
      },
      {
        label: 'Original hands',
        icon: 'pi pi-fw pi-play',
        routerLink: ['/gesture-detection/home'],
      },
      {
        label: 'Hands',
        icon: 'pi pi-fw pi-play',
        routerLink: ['/gesture-detection/implementation'],
      },
      {
        label: 'Custom',
        icon: 'pi pi-fw pi-play',
        routerLink: ['/gesture-detection/custom'],
      },
      {
        label: 'Segmentation',
        icon: 'pi pi-fw pi-play',
        routerLink: ['/gesture-detection/segmentation'],
      },
    ];

    this.cdr.markForCheck();
  }
}
