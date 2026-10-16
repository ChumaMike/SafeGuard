import { createHash, randomUUID } from "node:crypto";
import sharp from "sharp";
import { db, type DbOrTx } from "@/server/db/client";
import { evidence, type Evidence } from "@/server/db/schema";
import { Problem } from "@/server/domain/errors";
import { appendEvent, type Actor } from "@/server/domain/events";
import { storage } from "@/server/storage";

export const MAX_PHOTO_BYTES = 8 * 1024 * 1024;
export const MAX_PHOTOS = 5;

/**
 * Re-encodes an upload as a 1600px-max JPEG. sharp drops all metadata (EXIF, GPS, device) on
 * output by default, and rotate() with no argument applies the EXIF orientation first.
 * Never call withMetadata() here.
 */
export async function processPhoto(input: Buffer): Promise<Buffer> {
  try {
    return await sharp(input)
      .rotate()
      .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 80, mozjpeg: true })
      .toBuffer();
  } catch {
    throw new Problem(422, "That file is not a photo we can read");
  }
}

export interface StoredPhotoInput {
  caseId: string;
  actionId?: string | null;
  uploadedBy?: string | null;
  caption?: string | null;
}

export async function storePhoto(tx: DbOrTx, file: File, meta: StoredPhotoInput, actor: Actor, now: Date = new Date()): Promise<Evidence> {
  if (!file.type.startsWith("image/")) throw new Problem(422, "Only photos can be uploaded");
  if (file.size > MAX_PHOTO_BYTES) throw new Problem(422, "Photo is too large (max 8 MB)");

  const processed = await processPhoto(Buffer.from(await file.arrayBuffer()));
  const id = randomUUID();
  const key = `${id}.jpg`;
  await storage().put(key, processed);

  const row = await tx
    .insert(evidence)
    .values({
      id,
      caseId: meta.caseId,
      actionId: meta.actionId ?? null,
      storageKey: key,
      mime: "image/jpeg",
      bytes: processed.byteLength,
      sha256: createHash("sha256").update(processed).digest("hex"),
      caption: meta.caption ?? null,
      uploadedBy: meta.uploadedBy ?? null,
      createdAt: now.toISOString(),
    })
    .returning()
    .get();

  await appendEvent(tx, {
    caseId: meta.caseId,
    eventType: "evidence_added",
    actor,
    now,
    payload: { evidenceId: id, actionId: meta.actionId ?? null, bytes: processed.byteLength },
  });

  return row;
}

export function photosFromFormData(fd: FormData, field = "photos"): File[] {
  const files = fd.getAll(field).filter((v): v is File => typeof v === "object" && v !== null && "arrayBuffer" in v && (v as File).size > 0);
  if (files.length > MAX_PHOTOS) throw new Problem(422, `At most ${MAX_PHOTOS} photos per action`);
  return files;
}

/** Reporter photos on a public report. Stored privately, EXIF stripped, never shown on the public page. */
export async function attachPublicPhotos(caseId: string, files: File[], now: Date = new Date()): Promise<number> {
  const photos = files.slice(0, 2);
  if (photos.length === 0) return 0;
  await db.transaction(async (tx) => {
    for (const f of photos) {
      await storePhoto(tx, f, { caseId, uploadedBy: null, caption: "Reporter photo (safe distance)" }, { kind: "public_reporter" }, now);
    }
  });
  return photos.length;
}
