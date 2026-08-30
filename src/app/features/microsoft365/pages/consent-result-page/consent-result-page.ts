import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

type ConsentOutcome = 'success' | 'error';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  selector: 'app-consent-result-page',
  styleUrl: './consent-result-page.css',
  templateUrl: './consent-result-page.html',
})
export class ConsentResultPage {
  protected readonly outcome: ConsentOutcome;

  constructor(route: ActivatedRoute) {
    this.outcome = route.snapshot.data['consentOutcome'] === 'success' ? 'success' : 'error';
  }
}
