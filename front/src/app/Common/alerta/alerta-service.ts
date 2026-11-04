import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Alerta } from './alerta';

@Injectable({
  providedIn: 'root',
})
export class AlertaService {
  constructor(private dialog: MatDialog) {}

  mostrarError(mensaje: string, titulo: string = 'Ocurrió un error') {
    this.dialog.open(Alerta, {
      width: '400px',
      panelClass: 'alerta-dialog',
      data: { titulo, mensaje, tipo: 'error' }
    });
  }

  mostrarInfo(mensaje: string, titulo: string = 'Información') {
    this.dialog.open(Alerta, {
      width: '400px',
      panelClass: 'alerta-dialog',
      data: { titulo, mensaje, tipo: 'info' }
    });
  }
}
