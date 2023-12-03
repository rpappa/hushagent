import { Agent } from "node:https";

import defaultGot from "got";
import { httpsOverHttp } from "tunnel";
import { afterAll, describe, expect, it } from "vitest";

import { hush } from "../src/index.js";

import { createProxyChain, getRecentRequest } from "./fixtures/proxy.js";
import { startServer } from "./fixtures/server.js";

process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0";

const { port, getRequest, server } = await startServer();

const { port: proxyPort, server: proxyServer } = await createProxyChain();

const removeKeyHeader = <T>(headers: { [key: string]: T }) => {
    const { "x-req-key": reqKey, ...rest } = headers;
    return rest;
};

const got = defaultGot.extend({
    https: {
        rejectUnauthorized: false,
    },
    throwHttpErrors: false,
});

describe("server fixture", () => {
    it("works", async () => {
        const reqKey = "1234";
        const res = await got(``, {
            prefixUrl: `https://localhost:${port}`,
            headers: {
                "x-req-key": reqKey,
                otherHeader: "otherValue",
            },
        });

        expect(res.statusCode).toBe(200);
        expect(res.body).toBe("hello world\n");
        expect(getRequest(reqKey)).toBeDefined();
        // check header
        expect(getRequest(reqKey)?.headers["otherheader"]).toBe("otherValue");
        expect(getRequest("otherKey")).toBeUndefined();
    });
});

describe("hush", () => {
    it("works", async () => {
        const agent = hush(new Agent());

        const reqKey = `${Math.random()} ${Date.now()}`;
        const res = await got(``, {
            prefixUrl: `https://localhost:${port}`,
            agent: {
                https: agent,
            },
            headers: {
                "x-req-key": reqKey,
                otherHeader: "otherValue",
            },
        });

        expect(res.statusCode).toBe(200);
        expect(res.body).toBe("hello world\n");
        expect(getRequest(reqKey)).toBeDefined();
        // check header
        expect(getRequest(reqKey)?.headers["otherheader"]).toBe("otherValue");
        expect(getRequest("otherKey")).toBeUndefined();
    });

    it("can call httpbin", async () => {
        const agent = hush(new Agent());

        const res = await got(`https://httpbin.org/get`, {
            agent: {
                https: agent,
                http: agent,
            },
        });

        expect(res.statusCode).toBe(200);
        expect(res.body).toContain("httpbin.org");
    });

    it("can reach cloudflare", async () => {
        const agent = hush(new Agent());

        const res = await got(`https://cloudflare.com`, {
            agent: {
                https: agent,
                http: agent,
            },
        });

        expect(res.statusCode).toBe(200);
    });

    it("work with tunnel", async () => {
        const tunnelAgent = httpsOverHttp({
            proxy: {
                host: "localhost",
                port: proxyPort,
            },
        });

        const agent = hush(tunnelAgent);

        const res = await got(`https://httpbin.org/get`, {
            agent: {
                // @ts-expect-error broken types
                https: agent,
                http: agent,
            },
        });

        expect(res.statusCode).toBe(200);
        expect(res.body).toContain("httpbin.org");

        const proxyRequest = getRecentRequest()!;

        expect(proxyRequest).toBeDefined();

        expect(proxyRequest.hostname).not.toContain("httpbin.org");
        expect(JSON.stringify(proxyRequest.request.headers)).not.toContain("httpbin.org");
    });

    it("is identical from the server's perspective", async () => {
        const agent = hush(new Agent());

        // make 1 request with hush, and 1 without, each with a unique key
        const reqKey1 = `${Math.random()} ${Date.now()}`;
        const res1 = await got(``, {
            prefixUrl: `https://localhost:${port}`,
            agent: {
                https: agent,
            },
            headers: {
                "x-req-key": reqKey1,
                otherHeader: "otherValue",
            },
        });

        const reqKey2 = `${Math.random()} ${Date.now()}`;
        const res2 = await got(``, {
            prefixUrl: `https://localhost:${port}`,
            headers: {
                "x-req-key": reqKey2,
                otherHeader: "otherValue",
            },
        });

        // both requests should succeed
        expect(res1.statusCode).toBe(200);
        expect(res2.statusCode).toBe(200);

        // both requests should have been received by the server
        expect(getRequest(reqKey1)).toBeDefined();
        expect(getRequest(reqKey2)).toBeDefined();

        // the requests should be identical except for the key
        const req1 = getRequest(reqKey1)!;
        const req2 = getRequest(reqKey2)!;

        expect(req1.method).toBe(req2.method);
        expect(req1.url).toBe(req2.url);
        expect(req1.httpVersion).toBe(req2.httpVersion);
        expect(req1.httpVersionMajor).toBe(req2.httpVersionMajor);
        expect(req1.httpVersionMinor).toBe(req2.httpVersionMinor);
        expect(removeKeyHeader(req1.headers)).toEqual(removeKeyHeader(req2.headers));
    });
});

afterAll(() => {
    server.close();
});
