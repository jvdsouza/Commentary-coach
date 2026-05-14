import { writeFile, readFile, unlink, access } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { constants } from "fs";

/**
 * Get the uploads directory path
 */
export function getUploadsDir(): string {
  return path.join(process.cwd(), "public", "uploads");
}

/**
 * Get a unique filename based on timestamp and random string
 */
export function generateUniqueFilename(originalName: string, prefix = ""): string {
  const ext = path.extname(originalName);
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const name = prefix ? `${prefix}_` : "";
  return `${name}${timestamp}_${random}${ext}`;
}

/**
 * Validate file extension
 */
export function isValidVideoFile(filename: string): boolean {
  const validExtensions = [".mp4", ".mov", ".avi", ".mkv", ".flv", ".wmv"];
  const ext = path.extname(filename).toLowerCase();
  return validExtensions.includes(ext);
}

/**
 * Validate file extension for audio
 */
export function isValidAudioFile(filename: string): boolean {
  const validExtensions = [".mp3", ".m4a", ".aac", ".wav", ".flac"];
  const ext = path.extname(filename).toLowerCase();
  return validExtensions.includes(ext);
}

/**
 * Save file from buffer
 */
export async function saveFile(
  filePath: string,
  buffer: Buffer
): Promise<void> {
  try {
    await writeFile(filePath, buffer);
  } catch (error) {
    throw new Error(
      `Failed to save file: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Read file from disk
 */
export async function readFileFromDisk(filePath: string): Promise<Buffer> {
  try {
    return await readFile(filePath);
  } catch (error) {
    throw new Error(
      `Failed to read file: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Delete a file from disk
 */
export async function deleteFile(filePath: string): Promise<void> {
  try {
    if (existsSync(filePath)) {
      await unlink(filePath);
    }
  } catch (error) {
    console.error(`Failed to delete file ${filePath}:`, error);
    // Don't throw, just log the error
  }
}

/**
 * Check if file exists
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get file size in bytes
 */
export async function getFileSize(filePath: string): Promise<number> {
  try {
    const { size } = await readFile(filePath).then(
      (buffer) => ({ size: buffer.length })
    );
    return size;
  } catch {
    return 0;
  }
}
