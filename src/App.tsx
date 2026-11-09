import { useCallback, useEffect, useRef, useState } from "react";

import { InterfaceView } from "./InterfaceView";
import {
  fetchContractSpec,
  isValidContractId,
  NETWORKS,
  specFromWasm,
} from "./inspect";
import { buildInterface, type Interface } from "./model";
import { buildShareQuery, parseShareParams } from "./share";

interface Result {
  source: string;
  iface: Interface;
  // Present only for network inspections, which can be linked; a file
  // inspection has no shareable URL because the bytes are local.
  shareQuery?: string;
}

type Status =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "done"; result: Result };

export function App() {
  const [contractId, setContractId] = useState("");
  const [networkId, setNetworkId] = useState(NETWORKS[0].id);
  const [rpcUrl, setRpcUrl] = useState(NETWORKS[0].rpcUrl);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [copied, setCopied] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const network = NETWORKS.find((n) => n.id === networkId) ?? NETWORKS[0];

  function selectNetwork(id: string) {
    setNetworkId(id);
    const n = NETWORKS.find((x) => x.id === id);
    if (n) setRpcUrl(n.rpcUrl);
  }

  // Fetch and decode a contract from a given network, then reflect the
  // inspection in the URL so it can be bookmarked or shared. The share link
  // uses the network's default RPC, not any custom RPC typed into the form.
  const runNetworkInspection = useCallback(
    async (id: string, net: (typeof NETWORKS)[number], endpoint: string) => {
      setStatus({ kind: "loading" });
      setCopied(false);
      try {
        const entries = await fetchContractSpec(id, {
          rpcUrl: endpoint,
          passphrase: net.passphrase,
        });
        const shareQuery = buildShareQuery({ contractId: id, networkId: net.id });
        window.history.replaceState(null, "", shareQuery);
        setStatus({
          kind: "done",
          result: {
            source: `contract ${id}`,
            iface: buildInterface(entries),
            shareQuery,
          },
        });
      } catch (err) {
        setStatus({ kind: "error", message: describe(err) });
      }
    },
    [],
  );

  async function inspectNetwork(event: React.FormEvent) {
    event.preventDefault();
    const id = contractId.trim();
    if (!isValidContractId(id)) {
      setStatus({
        kind: "error",
        message:
          "That is not a valid contract ID. It should start with C and be 56 characters long.",
      });
      return;
    }
    await runNetworkInspection(id, network, rpcUrl);
  }

  // On first load, inspect whatever a shared link points at: pre-fill the form
  // from ?contract=…&network=… and, if the contract ID is valid, run it.
  useEffect(() => {
    const shared = parseShareParams(window.location.search);
    if (shared.contractId) setContractId(shared.contractId);
    const net = shared.networkId
      ? NETWORKS.find((n) => n.id === shared.networkId)
      : undefined;
    if (net) selectNetwork(net.id);

    if (shared.contractId && isValidContractId(shared.contractId)) {
      const target = net ?? network;
      void runNetworkInspection(shared.contractId, target, target.rpcUrl);
    }
    // Runs once, on mount, to honour the incoming link.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function copyShareLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be denied; the URL bar still holds the link.
    }
  }

  async function inspectFile(file: File) {
    setStatus({ kind: "loading" });
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const entries = specFromWasm(bytes);
      setStatus({
        kind: "done",
        result: { source: file.name, iface: buildInterface(entries) },
      });
    } catch (err) {
      setStatus({ kind: "error", message: describe(err) });
    }
  }

  return (
    <div className="app">
      <header>
        <h1>Lumenscan</h1>
        <p className="tagline">
          Inspect a deployed Soroban contract&rsquo;s interface — decoded from
          the contract&rsquo;s own WASM, right in your browser.
        </p>
      </header>

      <form className="controls" onSubmit={inspectNetwork}>
        <div className="row">
          <input
            type="text"
            className="contract-id"
            placeholder="Contract ID (C…)"
            value={contractId}
            onChange={(e) => setContractId(e.target.value)}
            autoCapitalize="characters"
            spellCheck={false}
            aria-label="Contract ID"
          />
          <button type="submit" disabled={status.kind === "loading"}>
            {status.kind === "loading" ? "Inspecting…" : "Inspect"}
          </button>
        </div>

        <div className="row options">
          <label>
            Network
            <select
              value={networkId}
              onChange={(e) => selectNetwork(e.target.value)}
            >
              {NETWORKS.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.label}
                </option>
              ))}
            </select>
          </label>
          <label className="rpc">
            RPC URL
            <input
              type="text"
              value={rpcUrl}
              onChange={(e) => setRpcUrl(e.target.value)}
              spellCheck={false}
            />
          </label>
        </div>

        <div className="row file-row">
          <span className="or">or</span>
          <button
            type="button"
            className="secondary"
            onClick={() => fileInput.current?.click()}
          >
            Inspect a local .wasm file
          </button>
          <input
            ref={fileInput}
            type="file"
            accept=".wasm,application/wasm"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void inspectFile(file);
              e.target.value = "";
            }}
          />
        </div>
      </form>

      <main>
        {status.kind === "idle" && (
          <p className="hint">
            Paste a contract ID, or load a <code>.wasm</code> build, to see its
            functions, types and events.
          </p>
        )}
        {status.kind === "loading" && <p className="hint">Fetching…</p>}
        {status.kind === "error" && (
          <div className="error" role="alert">
            {status.message}
          </div>
        )}
        {status.kind === "done" && (
          <>
            <p className="source">
              <code>{status.result.source}</code>
              {status.result.shareQuery && (
                <button
                  type="button"
                  className="share"
                  onClick={copyShareLink}
                  title="Copy a link to this inspection"
                >
                  {copied ? "Link copied" : "Copy link"}
                </button>
              )}
            </p>
            <InterfaceView iface={status.result.iface} />
          </>
        )}
      </main>

      <footer>
        <p>
          A companion to the{" "}
          <a href="https://github.com/LumenAnvil/lumenscan">lumenscan</a> CLI.
          Read-only: it never deploys, invokes, or changes anything.
        </p>
      </footer>
    </div>
  );
}

function describe(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}
