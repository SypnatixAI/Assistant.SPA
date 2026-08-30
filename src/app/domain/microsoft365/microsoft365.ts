export interface Microsoft365ConsentResponse {
  readonly authorizationUrl: string;
}

export interface Microsoft365OnboardingStatus {
  readonly isAdministrator: boolean;
  readonly connectionStatus: string;
  readonly isConsentComplete: boolean;
  readonly hasSelectedSite: boolean;
  readonly hasIndexedSource: boolean;
  readonly isComplete: boolean;
}

export interface Microsoft365Site {
  readonly siteId: string;
  readonly displayName: string;
  readonly webUrl: string;
  readonly isSelected: boolean;
}

export interface Microsoft365SitesResponse {
  readonly sites: readonly Microsoft365Site[];
}

export interface Microsoft365Drive {
  readonly siteId: string;
  readonly driveId: string;
  readonly displayName: string;
  readonly webUrl: string | null;
  readonly status: string;
  readonly isIndexed: boolean;
}

export interface Microsoft365List {
  readonly siteId: string;
  readonly listId: string;
  readonly displayName: string;
  readonly webUrl: string | null;
  readonly status: string;
  readonly isIndexed: boolean;
}

export interface Microsoft365ListsResponse {
  readonly lists: readonly Microsoft365List[];
}
