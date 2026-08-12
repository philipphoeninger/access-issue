// Reads the opt-in flag karma.conf.js passes into the browser via
// `client.args` when `CONTENT_RELEASE_GATE=1` is set (docs/SPEC_v1.md §4.1).
// A plain `npm test` run — and CI on pull requests — leaves this false, so
// scaffolding content never blocks an everyday merge.
export function isContentReleaseGateEnabled(): boolean {
  const karma = (globalThis as unknown as { __karma__?: { config?: { args?: unknown[] } } })
    .__karma__;
  return karma?.config?.args?.includes('content-release-gate') ?? false;
}
