// @vitest-environment node
import { test, expect, vi, beforeEach } from "vitest";
import { webcrypto } from "node:crypto";
import { jwtVerify } from "jose";

if (!globalThis.crypto) {
  globalThis.crypto = webcrypto as Crypto;
}

const { mockSet } = vi.hoisted(() => ({ mockSet: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ set: mockSet })),
}));

import { createSession } from "../auth";

const DEV_SECRET = new TextEncoder().encode("development-secret-key");

beforeEach(() => {
  mockSet.mockClear();
});

test("createSession sets the auth-token cookie once", async () => {
  await createSession("user-123", "user@example.com");

  expect(mockSet).toHaveBeenCalledTimes(1);
  const [name, token] = mockSet.mock.calls[0];
  expect(name).toBe("auth-token");
  expect(typeof token).toBe("string");
});

test("createSession signs a JWT containing the user id and email", async () => {
  await createSession("user-123", "user@example.com");

  const [, token] = mockSet.mock.calls[0];
  const { payload } = await jwtVerify(token, DEV_SECRET);

  expect(payload.userId).toBe("user-123");
  expect(payload.email).toBe("user@example.com");
});

test("createSession sets standard exp/iat claims", async () => {
  await createSession("user-123", "user@example.com");

  const [, token] = mockSet.mock.calls[0];
  const { payload } = await jwtVerify(token, DEV_SECRET);

  expect(typeof payload.iat).toBe("number");
  expect(typeof payload.exp).toBe("number");
  // 7-day lifetime
  expect(payload.exp! - payload.iat!).toBe(7 * 24 * 60 * 60);
});

test("createSession uses secure cookie options", async () => {
  await createSession("user-123", "user@example.com");

  const [, , options] = mockSet.mock.calls[0];
  expect(options.httpOnly).toBe(true);
  expect(options.sameSite).toBe("lax");
  expect(options.path).toBe("/");
  // not production in the test env
  expect(options.secure).toBe(false);
});

test("createSession sets the cookie to expire ~7 days out", async () => {
  const before = Date.now();
  await createSession("user-123", "user@example.com");
  const after = Date.now();

  const [, , options] = mockSet.mock.calls[0];
  expect(options.expires).toBeInstanceOf(Date);

  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  const expiresMs = (options.expires as Date).getTime();
  expect(expiresMs).toBeGreaterThanOrEqual(before + sevenDays - 1000);
  expect(expiresMs).toBeLessThanOrEqual(after + sevenDays + 1000);
});

test("createSession produces a verifiable token that fails with the wrong secret", async () => {
  await createSession("user-123", "user@example.com");
  const [, token] = mockSet.mock.calls[0];

  const wrongSecret = new TextEncoder().encode("not-the-secret");
  await expect(jwtVerify(token, wrongSecret)).rejects.toThrow();
});
