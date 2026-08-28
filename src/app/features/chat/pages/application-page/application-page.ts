import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-application-page',
  templateUrl: './application-page.html',
})
export class ApplicationPage {}
