import { describe, it, expect } from "vitest";
import path from "path";
import {
  isValidVideoFile,
  isValidAudioFile,
  generateUniqueFilename,
  getUploadsDir,
} from "./file-handler";

describe("isValidVideoFile", () => {
  it("accepts .mp4", () => expect(isValidVideoFile("video.mp4")).toBe(true));
  it("accepts .mov", () => expect(isValidVideoFile("clip.mov")).toBe(true));
  it("accepts .avi", () => expect(isValidVideoFile("video.avi")).toBe(true));
  it("accepts .mkv", () => expect(isValidVideoFile("video.mkv")).toBe(true));
  it("accepts .flv", () => expect(isValidVideoFile("video.flv")).toBe(true));
  it("accepts .wmv", () => expect(isValidVideoFile("video.wmv")).toBe(true));
  it("is case-insensitive (.MP4)", () => expect(isValidVideoFile("VIDEO.MP4")).toBe(true));
  it("is case-insensitive (.MOV)", () => expect(isValidVideoFile("clip.MOV")).toBe(true));
  it("rejects unknown extension", () => expect(isValidVideoFile("video.xyz")).toBe(false));
  it("rejects audio file", () => expect(isValidVideoFile("audio.mp3")).toBe(false));
  it("rejects file with no extension", () => expect(isValidVideoFile("noextension")).toBe(false));
});

describe("isValidAudioFile", () => {
  it("accepts .mp3", () => expect(isValidAudioFile("audio.mp3")).toBe(true));
  it("accepts .m4a", () => expect(isValidAudioFile("audio.m4a")).toBe(true));
  it("accepts .aac", () => expect(isValidAudioFile("audio.aac")).toBe(true));
  it("accepts .wav", () => expect(isValidAudioFile("audio.wav")).toBe(true));
  it("accepts .flac", () => expect(isValidAudioFile("audio.flac")).toBe(true));
  it("is case-insensitive (.MP3)", () => expect(isValidAudioFile("audio.MP3")).toBe(true));
  it("rejects video file", () => expect(isValidAudioFile("video.mp4")).toBe(false));
  it("rejects unknown extension", () => expect(isValidAudioFile("audio.xyz")).toBe(false));
});

describe("generateUniqueFilename", () => {
  it("preserves the file extension", () => {
    expect(path.extname(generateUniqueFilename("video.mp4"))).toBe(".mp4");
  });

  it("prepends prefix_ when prefix is provided", () => {
    expect(generateUniqueFilename("video.mp4", "upload").startsWith("upload_")).toBe(true);
  });

  it("does not start with underscore when no prefix is given", () => {
    expect(generateUniqueFilename("clip.mp4").startsWith("_")).toBe(false);
  });

  it("produces different values on consecutive calls", () => {
    const a = generateUniqueFilename("video.mp4");
    const b = generateUniqueFilename("video.mp4");
    expect(a).not.toBe(b);
  });
});

describe("getUploadsDir", () => {
  it("returns a path ending in public/uploads", () => {
    const dir = getUploadsDir();
    expect(dir.endsWith(path.join("public", "uploads"))).toBe(true);
  });
});
