import type { IntegrationProvider } from './agencyTypes';

export function parseOAuthState(state: string | null): {
  userId?: string;
  provider?: IntegrationProvider;
} | null {
  if (!state) return null;
  try {
    const padded = state.replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(padded);
    return JSON.parse(json) as { userId?: string; provider?: IntegrationProvider };
  } catch {
    return null;
  }
}

export function resolveOAuthProvider(
  providerParam: string | null,
  state: string | null,
): IntegrationProvider | null {
  if (providerParam) return providerParam as IntegrationProvider;
  return parseOAuthState(state)?.provider ?? null;
}
