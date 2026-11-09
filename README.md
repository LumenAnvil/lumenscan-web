# Lumenscan Web

Lumenscan in the browser: paste a deployed Soroban contract ID, or drop in a
local `.wasm` build, and see its interface — functions, user-defined types and
events — decoded from the contract's own WASM. No install, nothing to run.

It is the same idea as the
[`lumenscan`](https://github.com/LumenAnvil/lumenscan) CLI, as a small
single-page app, and it names types the same way (`Vec<String>`, `Option<u32>`,
`Result<(), Error>`), so the two read identically.

It is strictly **read-only**: it fetches and decodes, and never deploys,
invokes, signs, or changes anything.

## Stack

- **TypeScript + React + Vite** — a static SPA, deployable to any static host.
- **[`@stellar/stellar-sdk`](https://www.npmjs.com/package/@stellar/stellar-sdk)**
  does the heavy lifting: `contract.Client.from` fetches and decodes a deployed
  contract's spec over RPC, and `contract.Spec.fromWasm` reads the
  `contractspecv0` custom section out of raw `.wasm` bytes. Both yield the same
  `ScSpecEntry[]`, which [`src/model.ts`](src/model.ts) turns into a render-ready
  shape.

## Develop

```bash
npm install
npm run dev        # start the dev server
```

Other scripts:

```bash
npm run typecheck  # tsc --noEmit
npm test           # vitest: decodes the committed oracle.wasm fixture
npm run build      # production build into dist/
```

The test suite decodes the repository's own
[`tests/fixtures/oracle.wasm`](tests/fixtures) — the same fixture the Rust
`lumenscan` crate tests against — so the decoder is pinned to real contract
bytes rather than hand-built XDR, with no network needed.

## How the pieces fit

```
contract ID ─▶ contract.Client.from ─┐
                                      ├─▶ ScSpecEntry[] ─▶ buildInterface ─▶ <InterfaceView/>
 .wasm file ─▶ contract.Spec.fromWasm ┘        (model.ts)        (React)
```

| File | Responsibility |
| --- | --- |
| [`src/inspect.ts`](src/inspect.ts) | Get spec entries, from the network or a `.wasm` file |
| [`src/model.ts`](src/model.ts) | Decode `ScSpecEntry[]` into the view model; name types like the CLI |
| [`src/InterfaceView.tsx`](src/InterfaceView.tsx) | Render the decoded interface |
| [`src/App.tsx`](src/App.tsx) | The form, network selection, and state |

## Deploy

Pushing to `main` builds and publishes the app to GitHub Pages automatically —
see [`.github/workflows/pages.yml`](.github/workflows/pages.yml). The live site
is:

**<https://lumenanvil.github.io/lumenscan-web/>**

`npm run build` emits a static `dist/` you can host anywhere. For a project site
served from a sub-path, set the base path at build time so assets resolve under
it (the Pages workflow passes `/lumenscan-web/`):

```bash
BASE_PATH=/lumenscan-web/ npm run build
```

## Scope and next steps

A deliberately small core, with room to grow:

- **Contract metadata.** The `contractmetav0` section (SDK version, protocol) is
  not shown yet; the CLI's `meta` view is the reference.
- **Bundle size.** The SDK is large; code-splitting the network path from the
  file path would cut the initial download.

### Shareable links

A network inspection is captured in the URL as
`?contract=<id>&network=<testnet|mainnet>`, and the **Copy link** button copies
it. Opening such a link pre-fills the form and inspects automatically, so an
inspection can be bookmarked or shared. File inspections stay local and have no
link. The parse/build round trip lives in [`src/share.ts`](src/share.ts) and is
unit-tested.
