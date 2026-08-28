export interface AuthenticatedUser {
  readonly id: string;
  readonly displayName: string;
  readonly email: string;
}

export interface AuthenticatedOrganization {
  readonly id: string;
  readonly name: string;
}

export interface AuthenticatedSession {
  readonly user: AuthenticatedUser;
  readonly organization: AuthenticatedOrganization;
  readonly roles: readonly string[];
}
