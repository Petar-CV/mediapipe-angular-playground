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
        label: 'Početna',
        icon: 'pi pi-fw pi-home',
        routerLink: ['/'],
        routerLinkActiveOptions: { exact: true },
      },
    ];

    this.cdr.markForCheck();
  }
}
