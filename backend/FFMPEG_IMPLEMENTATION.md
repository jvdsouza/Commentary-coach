# FFmpeg Audio Extraction Implementation

This document describes how to use ffmpeg in the backend to extract audio from MP4 files.

## Overview

The implementation provides a complete audio extraction pipeline using ffmpeg with the following components:

### Files Created

1. **`app/utils/ffmpeg/index.ts`** - Core ffmpeg operations
2. **`app/utils/file-handler.ts`** - File system utilities
3. **`app/api/extract-audio/route.ts`** - API endpoint for audio extraction

## API Endpoint

### POST `/api/extract-audio`

Extract audio from an uploaded video file and receive the audio file directly.

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body: FormData with `video` file field

```bash
curl -X POST http://localhost:3000/api/extract-audio \
  -F "video=@/path/to/video.mp4" \
  --output extracted-audio.m4a
```

**Response (Success - 200):**
- Returns the audio file as binary data
- Headers include:
  - `Content-Type: audio/mp4`
  - `Content-Disposition: attachment; filename="extracted-audio.m4a"`
  - `Content-Length`: File size in bytes
  - `X-Audio-Duration`: Duration in seconds

**Response (Error):**
```json
{
  "error": "Failed to extract audio",
  "message": "Error details here"
}
```

### GET `/api/extract-audio/health`

Check if ffmpeg is available on the system.

```bash
curl http://localhost:3000/api/extract-audio/health
```

**Response:**
```json
{
  "status": "healthy",
  "ffmpegAvailable": true
}
```

## How It Works

1. **Upload** - Client uploads MP4 file via FormData
2. **Convert to Buffer** - File converted to Node.js Buffer
3. **Process In-Memory** - ffmpeg processes buffer using temporary files (cleaned up immediately)
4. **Return Audio** - Audio buffer streamed back to client as response body
5. **No Disk Storage** - No files are saved to disk

## Configuration

### Supported Video Formats
- MP4
- MOV
- AVI
- MKV
- FLV
- WMV

### Audio Output Format
Default: **M4A (AAC codec)** with 128k bitrate

To customize, modify the `extractAudio` call in `route.ts`:

```typescript
const audioBuffer = await extractAudio({
  inputBuffer: videoBuffer,
  audioCodec: "libmp3lame",  // For MP3
  audioBitrate: "192k",       // Higher bitrate
  format: "mp3",              // Output format
});
```

### File Size Limit
Default: **500MB**

Modify in `route.ts`:
```typescript
const MAX_FILE_SIZE = 1024 * 1024 * 1024; // 1GB
```

## Docker Deployment

The Docker setup already includes ffmpeg. Build and run:

```bash
docker-compose up --build
```

Verify ffmpeg is available inside the container:

```bash
docker-compose exec backend ffmpeg -version
```

## Example Usage in Frontend

### Using Fetch API

```javascript
async function extractAudio(videoFile) {
  const formData = new FormData();
  formData.append('video', videoFile);

  const response = await fetch('/api/extract-audio', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }

  // Get duration from header
  const duration = response.headers.get('X-Audio-Duration');
  
  // Convert response to blob
  const audioBlob = await response.blob();
  
  // Create audio element or download
  const audioUrl = URL.createObjectURL(audioBlob);
  const audio = new Audio(audioUrl);
  audio.play();
  
  return { audioUrl, duration };
}

// Usage
const videoFile = document.getElementById('videoInput').files[0];
const { audioUrl, duration } = await extractAudio(videoFile);
```

### Downloading Audio File

```javascript
async function extractAndDownload(videoFile) {
  const formData = new FormData();
  formData.append('video', videoFile);

  const response = await fetch('/api/extract-audio', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) throw new Error('Extraction failed');

  // Create download link
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'extracted-audio.m4a';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
```

### React Example

```jsx
function AudioExtractor() {
  const [loading, setLoading] = useState(false);
  const [duration, setDuration] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);

  const handleExtract = async (e) => {
    const videoFile = e.target.files[0];
    if (!videoFile) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('video', videoFile);

      const response = await fetch('/api/extract-audio', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      const duration = parseFloat(response.headers.get('X-Audio-Duration') || '0');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      setAudioUrl(url);
      setDuration(duration);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input type="file" accept="video/*" onChange={handleExtract} />
      {loading && <p>Extracting...</p>}
      {audioUrl && (
        <>
          <audio controls src={audioUrl} />
          <p>Duration: {duration.toFixed(2)}s</p>
        </>
      )}
    </div>
  );
}
```

## Advanced Usage

### Custom Audio Codec Examples

**MP3 Output (256k bitrate):**
```typescript
const audioBuffer = await extractAudio({
  inputBuffer: videoBuffer,
  audioCodec: "libmp3lame",
  audioBitrate: "256k",
  format: "mp3",
});
```

**WAV Output (Uncompressed):**
```typescript
const audioBuffer = await extractAudio({
  inputBuffer: videoBuffer,
  audioCodec: "pcm_s16le",
  audioBitrate: "320k",
  format: "wav",
});
```

## Error Handling

The implementation includes comprehensive error handling:

1. **FFmpeg not available** - Returns 503 Service Unavailable
2. **Invalid file type** - Returns 400 Bad Request
3. **File too large** - Returns 400 Bad Request
4. **Extraction failure** - Returns 500 Internal Server Error
5. **Automatic cleanup** - Failed conversions clean up partial files

## Performance Considerations

- Audio extraction is performed synchronously (blocking)
- For large files, consider implementing async job queues
- Consider caching extracted audio for frequently requested files
- Monitor disk space in `/public/uploads` directory

## Security Considerations

1. **File validation** - Only allows specific video formats
2. **Size limits** - Prevents resource exhaustion
3. **Unique filenames** - Prevents directory traversal
4. **Automatic cleanup** - Removes files on errors

## Troubleshooting

### FFmpeg command not found
Ensure ffmpeg is installed and in PATH. In Docker, the Dockerfile includes ffmpeg automatically.

### "Failed to extract audio" error
Check:
- ffmpeg availability: `curl http://localhost:3000/api/extract-audio/health`
- File permissions on uploads directory
- Disk space available
- Check server logs for detailed error messages

### Large files failing
Check file size limit and server timeout settings. Consider implementing chunked uploads for very large files.
