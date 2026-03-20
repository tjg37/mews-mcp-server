import type { MewsClientConfig, MewsClient } from "./types/mews.js";

export function createMewsClient(config: MewsClientConfig): MewsClient {
  async function request<T = unknown>(
    path: string,
    body: Record<string, unknown> = {},
  ): Promise<T> {
    const url = `${config.platformUrl}/api/connector/v1/${path}`;
    const fullBody = {
      ClientToken: config.clientToken,
      AccessToken: config.accessToken,
      Client: config.clientName,
      ...body,
    };

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fullBody),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        `Mews API error ${response.status} on ${path}: ${JSON.stringify(error)}`,
      );
    }

    return response.json() as Promise<T>;
  }

  return { request };
}
