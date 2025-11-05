
import type { NextApiRequest, NextApiResponse } from 'next';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';

const unlinkAsync = promisify(fs.unlink);

const YT_DLP_PATH = path.join(process.cwd(), 'bin', 'yt-dlp');
const FFMPEG_PATH = path.join(process.cwd(), 'bin', 'ffmpeg');
const DOWNLOADS_DIR = path.join(process.cwd(), 'downloads');

// Ensure downloads directory exists
if (!fs.existsSync(DOWNLOADS_DIR)) {
  fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url, formatId, isCombined, title } = req.body;

  console.log('Download request:', { url, formatId, isCombined, title });

  if (!url || !formatId) {
    return res.status(400).json({ error: 'URL and format ID are required' });
  }

  const isAudio = formatId.toString().includes('251') || formatId.toString().includes('140');
  const sanitizedTitle = (title || 'video').replace(/[^\w\s-]/g, '').replace(/\s+/g, '_').substring(0, 100);
  
  // Convert isCombined to boolean (it comes as string from form submission)
  const isCombinedFormat = isCombined === true || isCombined === 'true';
  
  let extension: string;
  let downloadArgs: string[];
  let needsMerging = false;
  let tempFilePath: string | null = null;

  try {
    if (isAudio) {
      // Audio - can stream directly
      extension = 'webm';
      downloadArgs = [
        '--no-warnings',
        '-f', formatId,
        '-o', '-',
        url
      ];
    } else if (isCombinedFormat) {
      // Combined video+audio - can stream directly
      extension = 'mp4';
      downloadArgs = [
        '--no-warnings',
        '-f', formatId,
        '-o', '-',
        url
      ];
    } else {
      // Video-only format - needs merging, must download to temp file first
      needsMerging = true;
      extension = 'mp4';
      tempFilePath = path.join(DOWNLOADS_DIR, `${Date.now()}_${sanitizedTitle}.mp4`);
      
      downloadArgs = [
        '--no-warnings',
        '--ffmpeg-location', FFMPEG_PATH,
        '-f', `${formatId}+bestaudio[ext=m4a]/${formatId}+bestaudio`,
        '--merge-output-format', 'mp4',
        '-o', tempFilePath,
        url
      ];
    }

    const filename = `${sanitizedTitle}.${extension}`;
    const contentType = isAudio ? 'audio/webm' : 'video/mp4';

    if (needsMerging && tempFilePath) {
      // Download to temp file first, then stream it
      await new Promise<void>((resolve, reject) => {
        const proc = spawn(YT_DLP_PATH, downloadArgs);

        proc.stderr.on('data', (data) => {
          console.error('yt-dlp stderr:', data.toString());
        });

        proc.on('close', (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error('Download failed'));
          }
        });

        proc.on('error', reject);

        req.on('close', () => {
          proc.kill();
          reject(new Error('Request closed'));
        });
      });

      // Now stream the temp file to response
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      const fileStream = fs.createReadStream(tempFilePath);
      
      fileStream.on('error', (error) => {
        console.error('File stream error:', error);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Failed to stream file' });
        }
      });

      fileStream.pipe(res);

      fileStream.on('end', async () => {
        // Clean up temp file
        try {
          if (tempFilePath) {
            await unlinkAsync(tempFilePath);
          }
        } catch (err) {
          console.error('Failed to delete temp file:', err);
        }
      });

      req.on('close', async () => {
        fileStream.destroy();
        try {
          if (tempFilePath && fs.existsSync(tempFilePath)) {
            await unlinkAsync(tempFilePath);
          }
        } catch (err) {
          console.error('Failed to delete temp file on close:', err);
        }
      });

    } else {
      // Stream directly for audio and combined formats
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Transfer-Encoding', 'chunked');

      const proc = spawn(YT_DLP_PATH, downloadArgs);

      proc.stdout.on('data', (chunk) => {
        res.write(chunk);
      });

      proc.stderr.on('data', (data) => {
        console.error('yt-dlp stderr:', data.toString());
      });

      proc.on('close', (code) => {
        if (code === 0) {
          res.end();
        } else {
          if (!res.headersSent) {
            res.status(500).json({ error: 'Download failed' });
          } else {
            res.end();
          }
        }
      });

      proc.on('error', (error) => {
        console.error('Process error:', error);
        if (!res.headersSent) {
          res.status(500).json({ error: error.message });
        } else {
          res.end();
        }
      });

      req.on('close', () => {
        proc.kill();
      });
    }

  } catch (error: any) {
    console.error('Error streaming video:', error);
    
    // Clean up temp file on error
    if (tempFilePath) {
      try {
        if (fs.existsSync(tempFilePath)) {
          await unlinkAsync(tempFilePath);
        }
      } catch (err) {
        console.error('Failed to delete temp file on error:', err);
      }
    }
    
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to stream video', details: error.message });
    }
  }
}
