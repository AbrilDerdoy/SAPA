import { effect, Injectable, signal } from '@angular/core';

export type Theme = 'light' | 'dark' ;

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly storageKey = 'sapa-theme';

  readonly theme = signal<Theme>(this.leerTemaInicial());
  constructor(){
    effect(()=>{
      const theme = this.theme();
      document.documentElement.dataset['theme'] = theme;
      localStorage.setItem(this.storageKey, theme);
    })
  }

  toggleTheme():void{
    this.theme.update((actual) => actual === 'light' ? 'dark' : 'light');
  }
  private leerTemaInicial(): Theme{
    const guardado = localStorage.getItem(this.storageKey);
    if(guardado === 'light' || guardado === 'dark') return guardado;
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }



}
