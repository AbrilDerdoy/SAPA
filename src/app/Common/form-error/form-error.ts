import { Component, computed, effect, input, OnInit } from '@angular/core';

@Component({
  selector: 'app-form-error',
  imports: [],
  templateUrl: './form-error.html',
  styleUrl: './form-error.css',
})
export class FormError{
  state = input.required<any>();

}
