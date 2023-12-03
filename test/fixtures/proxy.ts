import getPort from "get-port";
import { type PrepareRequestFunctionOpts, Server } from "proxy-chain";

const requestOptions: PrepareRequestFunctionOpts[] = [];

export function getRecentRequest() {
    return requestOptions.at(-1);
}

export async function createProxyChain() {
    const port = await getPort({
        port: 9500,
    });

    const server = new Server({
        port,
        verbose: false,
        prepareRequestFunction(request) {
            requestOptions.push(request);

            return {
                requestAuthentication: false,
            };
        },
    });

    await server.listen();

    return {
        port,
        server,
    };
}
