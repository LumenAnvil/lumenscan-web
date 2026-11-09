import { describe, expect, it } from "vitest";

import { buildShareQuery, parseShareParams } from "./share";

const CONTRACT = "CCUODXLWUCSRILGMI3NLALL3O5KUNLSDRT75X34FQDJDSALD6OREDDA4";

describe("parseShareParams", () => {
  it("reads contract and network from the query string", () => {
    expect(parseShareParams(`?contract=${CONTRACT}&network=testnet`)).toEqual({
      contractId: CONTRACT,
      networkId: "testnet",
    });
  });

  it("works with or without the leading question mark", () => {
    expect(parseShareParams(`contract=${CONTRACT}`)).toEqual({
      contractId: CONTRACT,
    });
  });

  it("omits missing or empty params rather than returning blanks", () => {
    expect(parseShareParams("")).toEqual({});
    expect(parseShareParams("?contract=&network=")).toEqual({});
    expect(parseShareParams("?network=mainnet")).toEqual({
      networkId: "mainnet",
    });
  });

  it("trims surrounding whitespace", () => {
    expect(parseShareParams(`?contract=%20${CONTRACT}%20`)).toEqual({
      contractId: CONTRACT,
    });
  });
});

describe("buildShareQuery", () => {
  it("produces a query string with both params", () => {
    expect(
      buildShareQuery({ contractId: CONTRACT, networkId: "testnet" }),
    ).toBe(`?contract=${CONTRACT}&network=testnet`);
  });

  it("round-trips through parseShareParams", () => {
    const state = { contractId: CONTRACT, networkId: "mainnet" };
    expect(parseShareParams(buildShareQuery(state))).toEqual(state);
  });
});
