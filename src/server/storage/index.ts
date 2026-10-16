import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Evidence storage adapter. Local disk for development and the expo laptop.
 * A Vercel Blob (private) driver can implement the same interface later.
 */
export interface EvidenceStorage {
  put(key: string, data: Buffer): Promise<void>;
  get(key: string): Promise<Buffer | null>;
  remove(key: string): Promise<void>;
}

function uploadDir(): string {
  return path.resolve(process.cwd(), process.env.UPLOAD_DIR ?? "./data/uploads");
}

/** Keys are UUID-based filenames we generate; never trust a client-supplied name. */
function safePath(key: string): string {
  if (!/^[a-f0-9-]{36}\.jpg$/.test(key)) throw new Error("Invalid storage key");
  return path.join(uploadDir(), key);
}

export const localStorage: EvidenceStorage = {
  async put(key, data) {
    await mkdir(uploadDir(), { recursive: true });
    await writeFile(safePath(key), data);
  },
  async get(key) {
    try {
      return await readFile(safePath(key));
    } catch {
      return null;
    }
  },
  async remove(key) {
    await rm(safePath(key), { force: true });
  },
};

export function storage(): EvidenceStorage {
  const driver = process.env.STORAGE_DRIVER ?? "local";
  if (driver !== "local") {
    throw new Error(`STORAGE_DRIVER=${driver} is not implemented yet; use "local"`);
  }
  return localStorage;
}
