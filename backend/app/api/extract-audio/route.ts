import { NextRequest, NextResponse } from "next/server";
import { extractAudio, getAudioDuration, checkFfmpegAvailable } from "@/app/utils/ffmpeg";
import { isValidVideoFile } from "@/app/utils/file-handler";
import { analyseCommentaryMethod } from "@/app/utils/analysis";

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB

/**
 * POST /api/extract-audio
 * Extract audio from an uploaded video file and return it directly
 *
 * Request body: FormData with 'video' file field
 * Response: Audio file buffer as response body
 */
export async function POST(request: NextRequest) {
  try {
    // Check if ffmpeg is available
    const ffmpegAvailable = await checkFfmpegAvailable();
    if (!ffmpegAvailable) {
      return NextResponse.json(
        { error: "FFmpeg is not available on this system" },
        { status: 503 }
      );
    }

    // Parse FormData
    const formData = await request.formData();
    const videoFile = formData.get("video") as File | null;

    if (!videoFile) {
      return NextResponse.json(
        { error: "No video file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!isValidVideoFile(videoFile.name)) {
      return NextResponse.json(
        { error: "Invalid file type. Supported: MP4, MOV, AVI, MKV, FLV, WMV" },
        { status: 400 }
      );
    }

    // Validate file size
    if (videoFile.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit` },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const buffer = await videoFile.arrayBuffer();
    const videoBuffer = Buffer.from(buffer);

    // Extract audio using ffmpeg (in-memory)
    const audioBuffer = await extractAudio({
      inputBuffer: videoBuffer,
      audioCodec: "aac",
      audioBitrate: "128k",
      format: "m4a",
    });

    // Optional: Analyze extracted audio to get feedback with timestamps
    const analysis = await analyseCommentaryMethod.assemblyAI(audioBuffer);

    // Get audio duration
    let duration = 0;
    try {
      duration = await getAudioDuration(audioBuffer);
    } catch (error) {
      console.warn("Failed to get audio duration:", error);
    }

    // Return audio file with appropriate headers
    return new NextResponse(new Uint8Array(audioBuffer), {
      status: 200,
      headers: {
        "Content-Type": "audio/mp4",
        "Content-Disposition": 'attachment; filename="extracted-audio.m4a"',
        "Content-Length": audioBuffer.length.toString(),
        "X-Audio-Duration": duration.toString(),
      },
    });
  } catch (error) {
    console.error("[API] Error extracting audio:", error);

    return NextResponse.json(
      {
        error: "Failed to extract audio",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/extract-audio/health
 * Check if ffmpeg is available
 */
export async function GET() {
  try {
    const available = await checkFfmpegAvailable();
    return NextResponse.json({
      status: available ? "healthy" : "unhealthy",
      ffmpegAvailable: available,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
