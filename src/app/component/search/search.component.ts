import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

interface SettingsMenuItem {
  label: string;
  route: string;
  icon: string;
}

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss'],
})
export class SearchComponent {
  readonly menuItems: SettingsMenuItem[] = [
    { label: 'General', route: 'general', icon: 'fa-solid fa-gear' },
    { label: 'Profile', route: 'profile', icon: 'fa-solid fa-user' },
    { label: 'Friends', route: 'friends', icon: 'fa-solid fa-user-group' },
    { label: 'Add Friends', route: 'add-friend', icon: 'fa-solid fa-user-plus' },
    { label: 'Reminders', route: 'reminders', icon: 'fa-solid fa-list-check' },
    { label: 'Stars', route: 'stars', icon: 'fa-solid fa-star' },
  ];

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {}

  navigateTo(route: string): void {
    this.router.navigate([route], { relativeTo: this.activatedRoute });
  }

  isActive(route: string): boolean {
    return this.router.url === `/settings/${route}`;
  }

  backHome(): void {
    this.router.navigate(['/home']);
  }
}
