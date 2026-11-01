import { Component, inject, signal } from '@angular/core';
import { Auth } from '../../service/auth';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-user-menu',
  imports: [RouterLink],
  templateUrl: './user-menu.html',
  styleUrl: './user-menu.css',
})
export class UserMenu {
  readonly auth = inject(Auth)
  menuAbierto = signal<boolean>(false);

  toggleMenu(){
    this.menuAbierto.update(valor => !valor);
  }

}
