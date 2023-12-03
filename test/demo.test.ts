import got, { type Agents } from "got";
import { httpsOverHttp } from "tunnel";
import { describe, expect, it } from "vitest";

import { hush } from "../src/index.js";

const { DEMO_PROXY } = process.env;

function makeAgent(doHush: boolean): Agents | undefined {
    const [host, port, username, password] = process.env["DEMO_PROXY"]?.split(":") ?? [];
    if (!host) {
        return;
    }

    const proxyAuth = username && password ? `${username}:${password}` : undefined;

    const agent = httpsOverHttp({
        proxy: {
            host,
            port: Number(port),
            proxyAuth,
        },
    });

    return {
        http: doHush ? hush(agent) : agent,
        // @ts-expect-error tunnel types are incorrect
        https: doHush ? hush(agent) : agent,
    };
}

const requestUrls = ["https://httpbin.org/get", "https://www.wikipedia.org", "https://www.cloudflare.com"];

describe.skipIf(!DEMO_PROXY)("Proxy without hush", () => {
    const agent = makeAgent(false);

    if (!agent) {
        return;
    }

    for (const url of requestUrls) {
        it(`can reach ${url}`, async () => {
            const res = await got(url, {
                agent,
                headers: {
                    "user-agent": "hush-proxy-test",
                },
                throwHttpErrors: false,
            });

            expect(res.statusCode).toBeDefined();
        });
    }
});

describe.skipIf(!DEMO_PROXY)("Proxy with hush", () => {
    const agent = makeAgent(true);

    if (!agent) {
        return;
    }

    for (const url of requestUrls) {
        it(`can reach ${url}`, async () => {
            const res = await got(url, {
                agent,
                headers: {
                    "user-agent": "hush-proxy-test",
                },
                throwHttpErrors: false,
            });

            expect(res.statusCode).toBeDefined();
        });
    }
});
