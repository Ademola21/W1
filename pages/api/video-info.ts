import type { NextApiRequest, NextApiResponse } from 'next';
import { spawn } from 'child_process';
import path from 'path';

const YT_DLP_PATH = path.join(process.cwd(), 'bin', 'yt-dlp');

interface Format {
  id: string;
  ext: string;
  resolution: string;
  size: string;
  type: 'video-only' | 'audio' | 'combined';
  codec: string;
  line: string;
}

interface VideoInfo {
  title: string;
  author: string;
  thumbnail: string;
  formats: {
    video: Array<{
      id: string;
      quality: string;
      qualityLabel: string;
      type: 'Video';
      size: string;
      canDownloadDirectly: boolean;
    }>;
    audio: Array<{
      id: string;
      quality: string;
      qualityLabel: string;
      type: 'Audio';
      size: string;
      codec: string;
    }>;
  };
}

function executeCommand(command: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args);
    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(`Command failed: ${stderr}`));
      }
    });

    proc.on('error', reject);
  });
}

function parseFileSize(sizeStr: string): number {
  if (!sizeStr || sizeStr === 'N/A' || sizeStr === '~') return 0;
  
  const match = sizeStr.match(/(\d+\.?\d*)\s*([KMGT])?i?B?/i);
  if (!match) return 0;
  
  const num = parseFloat(match[1]);
  const unit = (match[2] || 'B').toUpperCase();
  
  const multipliers: { [key: string]: number } = {
    'B': 1,
    'K': 1024,
    'M': 1024 * 1024,
    'G': 1024 * 1024 * 1024,
    'T': 1024 * 1024 * 1024 * 1024
  };
  
  return num * (multipliers[unit] || 1);
}

function formatFileSize(bytes: number): string {
  if (typeof bytes !== 'number' || isNaN(bytes) || bytes === 0) return 'N/A';
  
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return unitIndex === 0 ? `${size} ${units[unitIndex]}` : `${size.toFixed(2)} ${units[unitIndex]}`;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    // Get video metadata
    const metadataOutput = await executeCommand(YT_DLP_PATH, [
      '--dump-json',
      '--no-warnings',
      url
    ]);

    const metadata = JSON.parse(metadataOutput);

    // Get all formats
    const formatsOutput = await executeCommand(YT_DLP_PATH, [
      '-F',
      '--no-warnings',
      url
    ]);

    const lines = formatsOutput.split('\n');
    const videoFormats: Format[] = [];
    const audioFormats: Format[] = [];

    for (const line of lines) {
      if (!line.trim() || !line.match(/^\d/)) continue;

      const cleanLine = line.trim();
      
      const idMatch = cleanLine.match(/^(\d+)/);
      if (!idMatch) continue;
      const id = idMatch[1];
      
      const extMatch = cleanLine.match(/^\d+\s+(\S+)/);
      const ext = extMatch ? extMatch[1] : 'unknown';
      
      let resolution = 'unknown';
      if (cleanLine.includes('audio only')) {
        resolution = 'audio';
      } else {
        const resMatch = cleanLine.match(/(\d+x\d+)/);
        resolution = resMatch ? resMatch[1] : 'unknown';
      }
      
      let size = 'N/A';
      const sizeMatch = cleanLine.match(/(\d+\.?\d*\s*[KMGT]?i?B)(?=\s|$)/i);
      if (sizeMatch) {
        size = sizeMatch[1];
      }

      let codec = 'unknown';
      if (cleanLine.includes('avc1')) codec = 'h264';
      else if (cleanLine.includes('vp9')) codec = 'vp9';
      else if (cleanLine.includes('av01')) codec = 'av1';
      else if (cleanLine.includes('mp4a')) codec = 'aac';
      else if (cleanLine.includes('opus')) codec = 'opus';
      else if (cleanLine.includes('mp3')) codec = 'mp3';

      if (cleanLine.includes('audio only')) {
        audioFormats.push({ id, ext, resolution: 'audio', size, type: 'audio', codec, line: cleanLine });
      } else if (cleanLine.includes('video only') || cleanLine.includes('av01') || cleanLine.includes('vp9') || cleanLine.includes('avc1')) {
        videoFormats.push({ id, ext, resolution, size, type: 'video-only', codec, line: cleanLine });
      } else {
        videoFormats.push({ id, ext, resolution, size, type: 'combined', codec, line: cleanLine });
      }
    }

    // Find best audio (prefer AAC)
    const aacFormats = audioFormats.filter(a => a.codec === 'aac' || a.ext === 'm4a');
    const bestAudio = aacFormats.length > 0
      ? aacFormats.sort((a, b) => parseFileSize(b.size) - parseFileSize(a.size))[0]
      : audioFormats.sort((a, b) => parseFileSize(b.size) - parseFileSize(a.size))[0];

    // Group video formats by resolution
    const qualityOptions: { [key: string]: string } = {
      '144p': '256x144',
      '240p': '426x240', 
      '360p': '640x360',
      '480p': '854x480',
      '720p': '1280x720',
      '1080p': '1920x1080',
      '1440p': '2560x1440',
      '2160p': '3840x2160'
    };

    const resolutionGroups: { [key: string]: Format[] } = {};
    for (const format of videoFormats) {
      if (format.resolution !== 'audio' && format.resolution !== 'unknown') {
        if (!resolutionGroups[format.resolution]) {
          resolutionGroups[format.resolution] = [];
        }
        resolutionGroups[format.resolution].push(format);
      }
    }

    const processedVideoFormats = [];
    const seenVideoIds = new Set<string>();
    
    for (const [quality, resolution] of Object.entries(qualityOptions)) {
      if (resolutionGroups[resolution]) {
        const group = resolutionGroups[resolution];
        group.sort((a, b) => {
          if (a.type === 'combined' && b.type !== 'combined') return -1;
          if (b.type === 'combined' && a.type !== 'combined') return 1;
          return parseFileSize(a.size) - parseFileSize(b.size);
        });
        
        const bestFormat = group[0];
        
        // Skip if we've already seen this format ID
        if (seenVideoIds.has(bestFormat.id)) {
          continue;
        }
        seenVideoIds.add(bestFormat.id);
        
        const canDownloadDirectly = bestFormat.type === 'combined';
        
        let totalSize;
        if (canDownloadDirectly) {
          totalSize = parseFileSize(bestFormat.size);
        } else {
          const videoSize = parseFileSize(bestFormat.size);
          const audioSize = bestAudio ? parseFileSize(bestAudio.size) : 0;
          totalSize = videoSize + audioSize;
        }

        processedVideoFormats.push({
          id: bestFormat.id,
          quality: quality.includes('2160') ? '4K' : quality.includes('1080') || quality.includes('720') ? 'HD' : 'SD',
          qualityLabel: quality,
          type: 'Video' as const,
          size: formatFileSize(totalSize),
          canDownloadDirectly,
          isCombined: canDownloadDirectly
        });
      }
    }

    const seenAudioIds = new Set<string>();
    const processedAudioFormats = audioFormats
      .filter(a => a.codec === 'aac' || a.codec === 'opus' || a.codec === 'mp3')
      .filter(a => {
        if (seenAudioIds.has(a.id)) return false;
        seenAudioIds.add(a.id);
        return true;
      })
      .slice(0, 2)
      .map(a => ({
        id: a.id,
        quality: a.codec === 'aac' ? '320k' : '128k',
        qualityLabel: a.codec === 'aac' ? '320kbps High Quality' : '128kbps Standard',
        type: 'Audio' as const,
        size: formatFileSize(parseFileSize(a.size)),
        codec: a.codec
      }));

    const videoInfo: VideoInfo = {
      title: metadata.title || 'Unknown Title',
      author: metadata.uploader || metadata.channel || 'Unknown Author',
      thumbnail: metadata.thumbnail || '',
      formats: {
        video: processedVideoFormats,
        audio: processedAudioFormats
      }
    };

    res.status(200).json(videoInfo);
  } catch (error: any) {
    console.error('Error fetching video info:', error);
    res.status(500).json({ error: 'Failed to fetch video information', details: error.message });
  }
}
