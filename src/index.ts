import { lookup } from "node:dns/promises";

import type { Agent, ClientRequest, ClientRequestArgs } from "node:http";

/**
 * "hushes" an agent by performing a DNS lookup on the host before making the request.
 *
 * This prevents downstream servers from seeing the original host.
 *
 * @param originalAgent
 * @returns
 */
export function hush<T extends Agent>(originalAgent: T): T {
    const proxy = new Proxy(originalAgent, {
        get(target, prop, receiver) {
            if (prop === "addRequest") {
                return async (...args: readonly [ClientRequest, ClientRequestArgs]) => {
                    const [req, reqArgs] = args;

                    const hostLookup = await lookup(req.host, {
                        family: 4,
                    });

                    req.host = hostLookup.address;
                    reqArgs.host = reqArgs.host && hostLookup.address;
                    reqArgs.hostname = reqArgs.hostname && hostLookup.address;

                    // @ts-expect-error types with reflect
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
                    return Reflect.get(target, prop, receiver).call(originalAgent, req, reqArgs);
                };
            }

            return Reflect.get(target, prop, receiver);
        },
    });

    return proxy;
}
