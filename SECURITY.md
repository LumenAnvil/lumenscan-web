# Security policy

The Lumenscan web inspector is a read-only, client-side app: it fetches a
contract's spec and decodes it in the browser, and never deploys, invokes,
signs, or writes to the network. It handles no secrets and holds no keys.

## Reporting a vulnerability

Please report security issues privately through GitHub Security Advisories
rather than as a public issue:

<https://github.com/LumenAnvil/lumenscan-web/security/advisories/new>

Things worth reporting:

- a way the app could be made to sign, send, or otherwise write to the network
  (it must never do this),
- a cross-site scripting or injection path (for example via a crafted contract
  spec, type name, or uploaded `.wasm`),
- a supply-chain concern in the dependencies.

You can expect an acknowledgement, and we will keep you updated as we work on a
fix.
