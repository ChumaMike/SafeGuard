import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { processPhoto } from "@/server/services/evidence";

/** A JPEG with GPS and device EXIF, the kind a phone camera produces. */
async function phonePhotoWithGps(): Promise<Buffer> {
  return sharp({ create: { width: 2400, height: 1800, channels: 3, background: "#5a6b7c" } })
    .jpeg()
    .withExif({
      IFD0: { Make: "DemoPhone", Model: "X1", Software: "camera 1.0", Copyright: "test" },
      IFD3: {
        GPSLatitudeRef: "S",
        GPSLatitude: "26/1 18/1 1100/100",
        GPSLongitudeRef: "E",
        GPSLongitude: "27/1 52/1 3000/100",
      },
    })
    .toBuffer();
}

describe("evidence pipeline", () => {
  it("strips EXIF (including GPS) and resizes to 1600px", async () => {
    const input = await phonePhotoWithGps();
    const inMeta = await sharp(input).metadata();
    expect(inMeta.exif).toBeDefined();

    const out = await processPhoto(input);
    const outMeta = await sharp(out).metadata();
    expect(outMeta.exif).toBeUndefined();
    expect(outMeta.format).toBe("jpeg");
    expect(Math.max(outMeta.width ?? 0, outMeta.height ?? 0)).toBeLessThanOrEqual(1600);
    expect(out.toString("latin1")).not.toContain("DemoPhone");
    expect(out.toString("latin1")).not.toContain("GPS");
  });

  it("rejects something that is not an image", async () => {
    await expect(processPhoto(Buffer.from("not a photo"))).rejects.toMatchObject({ status: 422 });
  });
});
