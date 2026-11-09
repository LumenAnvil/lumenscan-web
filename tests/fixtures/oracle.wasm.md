# Test fixture: `oracle.wasm`

A small real Soroban contract build, used by [`src/model.test.ts`](../../src/model.test.ts)
to pin the decoder to genuine contract bytes rather than hand-built XDR.

It is the same fixture the Rust [`lumenscan`](https://github.com/LumenAnvil/lumenscan)
crate tests against, copied here so this repository's tests need nothing outside
it and no network access.
