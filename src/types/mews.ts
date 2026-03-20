export interface MewsClientConfig {
  platformUrl: string;
  clientToken: string;
  accessToken: string;
  clientName: string;
}

export interface MewsClient {
  request<T = unknown>(path: string, body?: Record<string, unknown>): Promise<T>;
}

export interface MewsPagination {
  Cursor: string;
  Count: number;
}
