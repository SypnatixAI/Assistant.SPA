import { Inject, Injectable } from '@angular/core';
import { MsalService } from '@azure/msal-angular';
import { AccountInfo } from '@azure/msal-browser';
import { Observable } from 'rxjs';

import {
  PUBLIC_APP_CONFIG,
  PublicAppConfig,
} from '../../config/public-app-config';
import { ApplicationNavigationService } from './application-navigation.service';

@Injectable({ providedIn: 'root' })
export class AuthenticationNavigationService {
  constructor(
    private readonly msalService: MsalService,
    @Inject(PUBLIC_APP_CONFIG)
    private readonly publicAppConfig: PublicAppConfig,
    private readonly applicationNavigationService: ApplicationNavigationService,
  ) {}

  login(): Observable<void> {
    return this.msalService.loginRedirect({
      redirectStartPage:
        this.applicationNavigationService.getApplicationAbsoluteUrl(),
      scopes: [this.publicAppConfig.entraScope],
    });
  }

  requestTokenInteractively(account: AccountInfo): Observable<void> {
    return this.msalService.acquireTokenRedirect({
      account,
      redirectStartPage:
        this.applicationNavigationService.getApplicationAbsoluteUrl(),
      scopes: [this.publicAppConfig.entraScope],
    });
  }

  logout(account: AccountInfo | null): Observable<void> {
    return this.msalService.logoutRedirect({
      account: account ?? undefined,
      postLogoutRedirectUri:
        this.applicationNavigationService.getLoginAbsoluteUrl(),
    });
  }
}
