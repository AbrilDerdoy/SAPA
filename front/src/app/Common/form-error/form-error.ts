import { Component, computed, effect, input, OnInit } from '@angular/core';
import { FieldState, FieldTree } from '@angular/forms/signals';

@Component({
  selector: 'app-form-error',
  imports: [],
  templateUrl: './form-error.html',
  styleUrl: './form-error.css',
})
export class FormError{
  field = input.required<FieldState<unknown>>();

  visible = computed(()=>{
    return this.field().touched() && this.field().invalid();
  })

  errores = computed(()=>{
    return this.field().errors();
  })
}
