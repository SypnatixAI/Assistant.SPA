import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LocalAccessTokenService {
  private accessToken: string | null = null;

  clear(): void {
    this.accessToken = null;
  }

  get(): string | null {
    return this.accessToken;
  }

  set(accessToken: string): void {
    if (accessToken.length === 0) {
      throw new Error('The local access token cannot be empty.');
    }

    this.accessToken = accessToken;
  }
}
