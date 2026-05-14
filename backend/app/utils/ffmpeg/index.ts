import { exec } from "child_process";
import { promisify } from "util";
import { writeFile, unlink } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { randomBytes } from "crypto";
import { tmpdir } from "os";

const execPromise = promisify(exec);

interface ExtractAudioOptions {
  inputBuffer: Buffer;
  audioCodec?: "aac" | "mp3" | "libmp3lame";
  audioBitrate?: string;
  format?: "m4a" | "mp3" | "wav";
}

/**
 * Extract audio from a video buffer using ffmpeg
 * @param options - Configuration for audio extraction
 * @returns Audio file buffer
 * @throws Error if ffmpeg command fails
 */
export async function extractAudio(options: ExtractAudioOptions): Promise<Buffer> {
  const {
    inputBuffer,
    audioCodec = "aac",
    audioBitrate = "128k",
    format = "m4a",
  } = options;

  // Generate temporary file paths
  const tempInputPath = path.join(tmpdir(), `video_${randomBytes(8).toString("hex")}.tmp`);
  const tempOutputPath = path.join(tmpdir(), `audio_${randomBytes(8).toString("hex")}.${format}`);

  try {
    // Write input buffer to temporary file
    await writeFile(tempInputPath, inputBuffer);

    // Build and execute ffmpeg command
    const command = buildFfmpegCommand({
      inputPath: tempInputPath,
      outputPath: tempOutputPath,
      audioCodec,
      audioBitrate,
    });

    await execPromise(command);
    console.log(`[FFmpeg] Audio extraction completed`);

    // Read the extracted audio file
    const { readFile } = await import("fs/promises");
    const audioBuffer = await readFile(tempOutputPath);

    return audioBuffer;
  } catch (error) {
    console.error(`[FFmpeg] Error extracting audio:`, error);
    throw new Error(
      `Failed to extract audio: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  } finally {
    // Clean up temporary files
    try {
      await unlink(tempInputPath);
    } catch {
      // File may not exist, ignore cleanup errors
    }
    try {
      await unlink(tempOutputPath);
    } catch {
      // File may not exist, ignore cleanup errors
    }
  }
}

/**
 * Build an ffmpeg command string for audio extraction
 */
function buildFfmpegCommand(options: {
  inputPath: string;
  outputPath: string;
  audioCodec: string;
  audioBitrate: string;
}): string {
  const { inputPath, outputPath, audioCodec, audioBitrate } = options;

  // Escape paths for shell execution
  const escapedInput = escapeShellPath(inputPath);
  const escapedOutput = escapeShellPath(outputPath);

  // Base ffmpeg command with minimal output
  let command = `ffmpeg -i ${escapedInput} -loglevel error`;

  // Audio codec settings
  command += ` -q:a 0 -map a`;
  command += ` -acodec ${audioCodec}`;
  command += ` -b:a ${audioBitrate}`;

  // Output file
  command += ` ${escapedOutput}`;

  // Run non-interactively and overwrite
  command += ` -y`;

  return command;
}

/**
 * Safely escape file paths for shell execution
 */
function escapeShellPath(filePath: string): string {
  return `"${filePath.replace(/"/g, '\\"')}"`;
}

/**
 * Get audio duration from buffer in seconds
 */
export async function getAudioDuration(buffer: Buffer): Promise<number> {
  // Generate temporary file path
  const tempPath = path.join(tmpdir(), `media_${randomBytes(8).toString("hex")}.tmp`);

  try {
    // Write buffer to temporary file
    await writeFile(tempPath, buffer);

    const command = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1:noinherit=1 "${tempPath}"`;
    const { stdout } = await execPromise(command);
    const duration = parseFloat(stdout.trim());
    return isNaN(duration) ? 0 : duration;
  } catch (error) {
    console.error(`[FFmpeg] Error getting duration:`, error);
    return 0; // Return 0 instead of throwing
  } finally {
    // Clean up temporary file
    try {
      await unlink(tempPath);
    } catch {
      // Ignore cleanup errors
    }
  }
}

/**
 * Check if ffmpeg is available on the system
 */
export async function checkFfmpegAvailable(): Promise<boolean> {
  try {
    await execPromise("ffmpeg -version");
    return true;
  } catch {
    return false;
  }
}
