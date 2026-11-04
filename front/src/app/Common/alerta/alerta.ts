import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';

export interface AlertaData {
  titulo: string;
  mensaje: string;
  tipo: 'error' | 'info' | 'exito';
  textoBoton?: string; 
}

@Component({
  selector: 'app-alerta',
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  templateUrl: './alerta.html',
  styleUrl: './alerta.css',
})
export class Alerta {
  constructor(@Inject(MAT_DIALOG_DATA) public data: AlertaData) {
    // Valor por defecto para el botón
    this.data.textoBoton = data.textoBoton || 'Aceptar';
  }

  // Método auxiliar para asignar la clase de color según el tipo
  obtenerClaseTitulo(): string {
    return `titulo-${this.data.tipo}`;
  }

  // Método auxiliar para el color del botón de Material
  obtenerColorBoton(): string {
    return this.data.tipo === 'error' ? 'warn' : 'primary';
  }
}
