import { Component, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLinkWithHref } from '@angular/router';
import { Auth } from './Usuario/service/auth';
import { UserMenu } from './Usuario/components/user-menu/user-menu';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLinkWithHref,UserMenu],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('SAPA-FRONT');
  readonly auth = inject(Auth)
}
