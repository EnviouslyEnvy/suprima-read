import { afterEach, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { POST } from "../app/api/prepare/route.ts";

const realFetch = globalThis.fetch;
const originalEnv = {
  NODE_ENV: process.env.NODE_ENV,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  APP_PASSWORD: process.env.APP_PASSWORD,
};
const source =
  "Some reading tools can help readers follow familiar material. Difficult ideas may still need more time and careful review.";
const brief = {
  title: "Read with care",
  overview: "Adjust the pace to the material.",
  sections: [
    {
      heading: "Take time",
      text: "Reading tools can help with familiar material. Difficult ideas may need careful review.",
      sourceSentences: [0, 1],
    },
  ],
  takeaways: ["Take time with difficult ideas."],
};

beforeEach(() => {
  Object.assign(process.env, {
    NODE_ENV: "development",
    OPENAI_API_KEY: "test-only-key",
    APP_PASSWORD: "test-workspace-password",
  });
  globalThis.fetch = async () => {
    throw new Error("Unexpected provider request");
  };
});
afterEach(() => {
  globalThis.fetch = realFetch;
  for (const [name, value] of Object.entries(originalEnv)) {
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }
});
function request(
  body: unknown = { source, detail: "balanced" },
  headers: Record<string, string> = {},
) {
  return new Request("http://localhost:3000/api/prepare", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      host: "127.0.0.1:3000",
      "x-app-password": "test-workspace-password",
      ...headers,
    },
    body: JSON.stringify(body),
  });
}
function success(value: unknown = brief) {
  return Response.json({
    status: "completed",
    output: [
      { content: [{ type: "output_text", text: JSON.stringify(value) }] },
    ],
  });
}

test("invalid input and foreign browser origins fail before calling the provider", async () => {
  assert.equal(
    (await POST(request({ source: "short", detail: "balanced" }))).status,
    400,
  );
  assert.equal(
    (await POST(request(undefined, { origin: "https://example.com" }))).status,
    403,
  );
  assert.equal(
    (await POST(request({ source, detail: "invalid" }))).status,
    400,
  );
  assert.equal(
    (await POST(request({ source: "a".repeat(100001), detail: "balanced" })))
      .status,
    400,
  );
});

test("same-origin preparation works with an internal Next.js hostname and uses no provider storage", async () => {
  let payload: Record<string, unknown> | undefined;
  globalThis.fetch = async (_url, init) => {
    payload = JSON.parse(String(init?.body));
    return success();
  };
  const response = await POST(
    request(undefined, { origin: "http://127.0.0.1:3000" }),
  );
  assert.equal(response.status, 200);
  assert.deepEqual((await response.json()).brief, brief);
  assert.equal(payload?.store, false);
  assert.equal(typeof payload?.instructions, "string");
});

test("password protection cannot be bypassed in development or production", async () => {
  let providerCalls = 0;
  globalThis.fetch = async () => {
    providerCalls++;
    return success();
  };
  for (const environment of ["development", "production"]) {
    Object.assign(process.env, { NODE_ENV: environment });
    delete process.env.APP_PASSWORD;
    const initialCalls = providerCalls;
    assert.equal((await POST(request())).status, 503);
    process.env.APP_PASSWORD = "test-workspace-password";
    const missing = await POST(request(undefined, { "x-app-password": "" }));
    assert.equal(missing.status, 401);
    assert.equal((await missing.json()).needsPassword, true);
    assert.equal(
      (await POST(request(undefined, { "x-app-password": "wrong" }))).status,
      401,
    );
    assert.equal(
      providerCalls,
      initialCalls,
      "Unauthorized requests must never reach the paid provider",
    );
    assert.equal((await POST(request())).status, 200);
    assert.equal(providerCalls, initialCalls + 1);
  }
});

test("invalid source references and incomplete outputs are rejected", async () => {
  globalThis.fetch = async () =>
    success({
      ...brief,
      sections: [{ ...brief.sections[0], sourceSentences: [100] }],
    });
  assert.equal((await POST(request())).status, 502);
  globalThis.fetch = async () => Response.json({ status: "incomplete" });
  assert.equal((await POST(request())).status, 502);
  globalThis.fetch = async () =>
    Response.json({
      status: "completed",
      output: [{ content: [{ type: "refusal" }] }],
    });
  assert.equal((await POST(request())).status, 422);
});

test("exhausted credits and transient rate limits produce different, redacted messages", async () => {
  globalThis.fetch = async () =>
    Response.json(
      {
        error: {
          type: "insufficient_quota",
          code: "credit_balance_exhausted",
          message: "private provider details",
        },
      },
      { status: 429 },
    );
  const quota = await (await POST(request())).json();
  assert.equal(quota.code, "insufficient_quota");
  assert.doesNotMatch(JSON.stringify(quota), /private provider details/);
  globalThis.fetch = async () =>
    Response.json({ error: { code: "rate_limit_exceeded" } }, { status: 429 });
  const limit = await (await POST(request())).json();
  assert.equal(limit.code, "rate_limit");
  assert.match(limit.error, /temporary rate limit/);
});

test("only two generations can be active in a server process", async () => {
  const release: (() => void)[] = [];
  globalThis.fetch = async () =>
    new Promise<Response>((resolve) => {
      release.push(() => resolve(success()));
    });
  const first = POST(request());
  const second = POST(request());
  const third = POST(request());
  // All three start together, including their asynchronous body readers.
  await new Promise<void>((resolve) => setImmediate(resolve));
  assert.equal(release.length, 2);
  assert.equal((await third).status, 429);
  release.forEach((finish) => finish());
  assert.equal((await first).status, 200);
  assert.equal((await second).status, 200);
  globalThis.fetch = async () => success();
  assert.equal((await POST(request())).status, 200);
});
