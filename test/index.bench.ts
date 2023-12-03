/* eslint-disable no-await-in-loop */
import { Agent } from "node:https";

import defaultGot from "got";
import { httpsOverHttp } from "tunnel";
import { afterAll, bench, describe, expect } from "vitest";

import { hush } from "../src/index.js";

import { createProxyChain } from "./fixtures/proxy.js";
import { startServer } from "./fixtures/server.js";

process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0";

const { port, server } = await startServer();

const { port: proxyPort, server: proxyServer } = await createProxyChain();

const got = defaultGot.extend({
    https: {
        rejectUnauthorized: false,
    },
    throwHttpErrors: false,
});

describe("requests to localhost", () => {
    bench(
        "with hush",
        async () => {
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
        },
        {
            time: 5000,
        }
    );

    bench(
        "without hush",
        async () => {
            const reqKey = `${Math.random()} ${Date.now()}`;
            const res = await got(``, {
                prefixUrl: `https://localhost:${port}`,
                headers: {
                    "x-req-key": reqKey,
                    otherHeader: "otherValue",
                },
            });

            expect(res.statusCode).toBe(200);
        },
        {
            time: 5000,
        }
    );
});

describe("requests to httpbin with proxy", () => {
    bench(
        "with hush",
        async () => {
            const agent = hush(
                httpsOverHttp({
                    proxy: {
                        host: "localhost",
                        port: proxyPort,
                    },
                })
            );

            const reqKey = `${Math.random()} ${Date.now()}`;
            const res = await got(`https://httpbin.org/get`, {
                agent: {
                    // @ts-expect-error broken types
                    https: agent,
                },
                headers: {
                    "x-req-key": reqKey,
                    otherHeader: "otherValue",
                },
            });

            expect(res.statusCode).toBe(200);
        },
        {
            time: 1,
            iterations: 50,
        }
    );

    bench(
        "without hush",
        async () => {
            const agent = httpsOverHttp({
                proxy: {
                    host: "localhost",
                    port: proxyPort,
                },
            });

            const reqKey = `${Math.random()} ${Date.now()}`;
            const res = await got(`https://httpbin.org/get`, {
                agent: {
                    // @ts-expect-error broken types
                    https: agent,
                },
                headers: {
                    "x-req-key": reqKey,
                    otherHeader: "otherValue",
                },
            });

            expect(res.statusCode).toBe(200);
        },
        {
            time: 1,
            iterations: 50,
        }
    );
});

afterAll(async () => {
    server.close();
    await proxyServer.close(true);
});
