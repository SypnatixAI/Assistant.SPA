import { Injectable } from '@angular/core';

const LOCAL_ACCESS_TOKEN_KEY = 'assistantCore.localAccessToken';

@Injectable({ providedIn: 'root' })
export class LocalAccessTokenService {
  clear(): void {
    sessionStorage.removeItem(LOCAL_ACCESS_TOKEN_KEY);
  }

  get(): string | null {
    return sessionStorage.getItem(LOCAL_ACCESS_TOKEN_KEY);
  }

  set(accessToken: string): void {
    if (accessToken.length === 0) {
      throw new Error('The local access token cannot be empty.');
    }

    sessionStorage.setItem(LOCAL_ACCESS_TOKEN_KEY, accessToken);
  }
}
