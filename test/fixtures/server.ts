import https from "node:https";

import getPort from "get-port";

import { getKeys } from "./keys.js";

import type http from "node:http";

export const startServer = async () => {
    const { privateKey, publicKey } = await getKeys();

    const options = {
        key: privateKey,
        cert: publicKey,
    };

    const requests = new Map<string, http.IncomingMessage>();

    const server = https.createServer(options, (req, res) => {
        // read the key from "x-req-key" header
        const key = req.headers["x-req-key"];

        // return 400 if no key is provided, or if the key is a string[]
        if (!key || Array.isArray(key)) {
            res.writeHead(400);
            res.end();
            return;
        }

        requests.set(key, req);

        res.writeHead(200);
        res.end("hello world\n");
    });

    const port = await getPort({
        port: 7890,
    });

    server.listen(port);

    function getRequest(key: string) {
        return requests.get(key);
    }

    return {
        port,
        getRequest,
        server,
    };
};
