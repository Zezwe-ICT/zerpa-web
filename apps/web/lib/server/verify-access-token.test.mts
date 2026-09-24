import assert from "node:assert/strict";
import { test } from "node:test";
import { apiSessionUrl, checkAccessToken, keysMatch } from "./verify-access-token.ts";

const JWT = "eyJhbGciOiJIUzI1NiJ9.eyJ0eXAiOiJhY2Nlc3MifQ.signature";

test("internal keys match only when equal", () => {
  assert.equal(keysMatch("k-123", "k-123"), true);
  assert.equal(keysMatch("k-123", "k-124"), false);
  assert.equal(keysMatch("k-123", "k-123 "), false);
});

test("session URL prefers the server-side API base", () => {
  assert.equal(
    apiSessionUrl({ ZERPA_API_URL: "http://api:4000/api/v1/", NEXT_PUBLIC_API_URL: "http://localhost:4000/api/v1" }),
    "http://api:4000/api/v1/auth/session",
  );
  assert.equal(apiSessionUrl({}), "http://localhost:4000/api/v1/auth/session");
});

test("a long non-JWT bearer is rejected without calling the API", async () => {
  let called = false;
  const fetchImpl: typeof fetch = async () => {
    called = true;
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  };
  const result = await checkAccessToken("this-is-a-long-fake-token-not-a-jwt", fetchImpl, {});
  assert.equal(result, "invalid");
  assert.equal(called, false);
});

test("a live session response is accepted", async () => {
  const fetchImpl: typeof fetch = async (input, init) => {
    assert.equal(String(input), "http://localhost:4000/api/v1/auth/session");
    const headers = new Headers(init?.headers);
    assert.equal(headers.get("authorization"), `Bearer ${JWT}`);
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  };
  assert.equal(await checkAccessToken(`  ${JWT}  `, fetchImpl, {}), "valid");
});

test("401, 403, and a 200 without ok are rejected", async () => {
  for (const status of [401, 403]) {
    const fetchImpl: typeof fetch = async () => new Response("no", { status });
    assert.equal(await checkAccessToken(JWT, fetchImpl, {}), "invalid");
  }
  const html: typeof fetch = async () => new Response("<html>ok</html>", { status: 200 });
  assert.equal(await checkAccessToken(JWT, html, {}), "invalid");
});

test("API failures fail closed", async () => {
  const down: typeof fetch = async () => new Response("err", { status: 502 });
  assert.equal(await checkAccessToken(JWT, down, {}), "unavailable");
  const thrown: typeof fetch = async () => {
    throw new Error("connect ECONNREFUSED");
  };
  assert.equal(await checkAccessToken(JWT, thrown, {}), "unavailable");
});
