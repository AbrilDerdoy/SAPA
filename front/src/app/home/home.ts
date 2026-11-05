import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { HealthTipCarousel } from '../HealthTip/components/health-tip-carousel/health-tip-carousel';

@Component({
  selector: 'app-home',
  imports: [RouterLink, HealthTipCarousel],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {}