import { execSync } from "node:child_process";
import fs from "node:fs/promises";

const KEYS_DIR = "./test/fixtures/keys";

// key generation functions
const generateKeyPair = () => {
    execSync(`openssl genrsa -out ${KEYS_DIR}/private.pem 1024`);
    execSync(`openssl req -new -key ${KEYS_DIR}/private.pem -out ${KEYS_DIR}/certrequest.csr -subj "/C=US"`);
    execSync(
        `openssl x509 -req -in ${KEYS_DIR}/certrequest.csr -signkey ${KEYS_DIR}/private.pem -out ${KEYS_DIR}/certificate.pem`
    );
};

// generate keys if they don't exist
const generateKeysIfNotExist = async () => {
    try {
        await fs.access(KEYS_DIR);
    } catch {
        await fs.mkdir(KEYS_DIR);
    }

    try {
        await fs.access(`${KEYS_DIR}/private.pem`);
        await fs.access(`${KEYS_DIR}/certificate.pem`);
    } catch {
        generateKeyPair();
    }
};

// read keys
const readKeys = async () => {
    const privateKey = await fs.readFile(`${KEYS_DIR}/private.pem`);
    const publicKey = await fs.readFile(`${KEYS_DIR}/certificate.pem`);
    return { privateKey, publicKey };
};

// get keys / generate them, to be used in server.ts
export const getKeys = async () => {
    await generateKeysIfNotExist();
    return readKeys();
};
