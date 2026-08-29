export type ApiErrorMetadata = Readonly<Record<string, unknown>>;

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly metadata: ApiErrorMetadata | null,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
