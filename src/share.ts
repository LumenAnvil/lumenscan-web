// Encoding an inspection as a shareable URL.
//
// A network inspection is fully described by a contract ID and a network, so it
// can be captured in the query string and linked. These helpers are pure — they
// take and return strings — so the round trip is unit-testable without a DOM,
// and App wires them to `window.location`.

/** The part of an inspection that a URL can carry. */
export interface ShareState {
  contractId: string;
  networkId: string;
}

/**
 * Read a shareable inspection from a URL query string (e.g. `location.search`).
 *
 * Returns only the keys that are present and non-empty; validation (is the
 * contract ID real, is the network known) is the caller's job, so this stays a
 * pure parse.
 */
export function parseShareParams(search: string): Partial<ShareState> {
  const params = new URLSearchParams(search);
  const out: Partial<ShareState> = {};

  const contractId = params.get("contract")?.trim();
  if (contractId) out.contractId = contractId;

  const networkId = params.get("network")?.trim();
  if (networkId) out.networkId = networkId;

  return out;
}

/**
 * Build the query string — including the leading `?` — that links to an
 * inspection. A file-based inspection has no shareable URL (the bytes are
 * local), so only network inspections call this.
 */
export function buildShareQuery(state: ShareState): string {
  const params = new URLSearchParams();
  params.set("contract", state.contractId);
  params.set("network", state.networkId);
  return `?${params.toString()}`;
}
