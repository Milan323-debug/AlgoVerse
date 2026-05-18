import path from 'path';
import fs from 'fs';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import { v2 as cloudinary } from 'cloudinary';

import {
  generateBubbleSortSteps,
  generateSelectionSortSteps,
  generateInsertionSortSteps,
  generateMergeSortSteps,
  generateQuickSortSteps,
  generateBinarySearchSteps,
  generateBSTInsertSteps,
} from '../video/data-helpers.js';

// Cache the Webpack compilation location to optimize subsequent rendering speeds
let cachedBundleLocation = null;

async function getRemotionBundle() {
  if (cachedBundleLocation) {
    return cachedBundleLocation;
  }
  
  const entryPoint = path.resolve('./src/video/index.js');
  console.log(`[Remotion] Bundling video code at entry point: ${entryPoint}`);
  
  cachedBundleLocation = await bundle({
    entryPoint,
  });
  
  console.log('[Remotion] Bundling completed successfully!');
  return cachedBundleLocation;
}

// Check and configure Cloudinary if credentials are provided in .env
const hasCloudinary = 
  process.env.CLOUDINARY_CLOUD_NAME && 
  process.env.CLOUDINARY_API_KEY && 
  process.env.CLOUDINARY_API_SECRET;

if (hasCloudinary) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  console.log('[Cloudinary] SDK configured successfully.');
} else {
  console.log('[Cloudinary] Credentials not fully set up. Falling back to local static hosting.');
}

/**
 * REST API Endpoint: POST /api/video/render
 * Body params: { algoId, arrayData, target }
 */
export const renderVideo = async (req, res) => {
  try {
    const { algoId = 'bubble-sort', arrayData = [64, 34, 25, 12, 22], target = 23 } = req.body;

    console.log(`[Video API] Received render request for ${algoId}`);

    // Validate inputs
    if (!Array.isArray(arrayData) || arrayData.length === 0) {
      return res.status(400).json({ error: 'arrayData must be a non-empty array' });
    }
    
    // 1. Calculate dynamic video duration based on the step count
    let steps = [];
    switch (algoId) {
      case 'bubble-sort':
        steps = generateBubbleSortSteps(arrayData);
        break;
      case 'selection-sort':
        steps = generateSelectionSortSteps(arrayData);
        break;
      case 'insertion-sort':
        steps = generateInsertionSortSteps(arrayData);
        break;
      case 'merge-sort':
        steps = generateMergeSortSteps(arrayData);
        break;
      case 'quick-sort':
        steps = generateQuickSortSteps(arrayData);
        break;
      case 'binary-search':
        steps = generateBinarySearchSteps(arrayData, parseInt(target));
        break;
      case 'bst-insert':
        steps = generateBSTInsertSteps(parseInt(target));
        break;
      default:
        return res.status(400).json({ error: `Invalid algoId: ${algoId}` });
    }

    const framesPerStep = 45; // Matches the timing in AlgoVisualizer.jsx
    const durationInFrames = Math.max(steps.length * framesPerStep, 45); // At least 1.5 seconds

    console.log(`[Video API] Rendering ${steps.length} steps (${durationInFrames} frames)`);

    // Resolve pre-installed browser path inside Docker (avoids downloading Chrome on Render)
    const browserExecutable = fs.existsSync('/usr/bin/google-chrome')
      ? '/usr/bin/google-chrome'
      : undefined;

    // 2. Retrieve or build the Remotion bundle
    const bundleLocation = await getRemotionBundle();

    // 3. Select composition with active props
    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id: 'AlgoVisualizer',
      inputProps: { algoId, arrayData, target },
      browserExecutable,
    });

    // Ensure output directory exists
    const outDir = path.resolve('./out');
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    const filename = `render-${algoId}-${Date.now()}.mp4`;
    const localOutputPath = path.join(outDir, filename);

    // 4. Render media to file
    console.log(`[Remotion] Commencing render to: ${localOutputPath}`);
    await renderMedia({
      composition: {
        ...composition,
        durationInFrames, // Inject custom dynamic duration
      },
      serveUrl: bundleLocation,
      codec: 'h264',
      outputLocation: localOutputPath,
      inputProps: { algoId, arrayData, target },
      browserExecutable,
      chromiumOptions: {
        enableMultiProcessOnLinux: false, // Prevents OOM crashes by running Chromium in single-process mode
      }
    });
    console.log('[Remotion] Render completed successfully!');

    // 5. Upload to Cloudinary if available, otherwise return local URL
    if (hasCloudinary) {
      console.log('[Cloudinary] Uploading video...');
      const uploadResult = await cloudinary.uploader.upload(localOutputPath, {
        resource_type: 'video',
        folder: 'algoverse_videos',
      });
      
      console.log('[Cloudinary] Upload successful!');
      
      // Cleanup temp local video file asynchronously to keep server clean
      fs.unlink(localOutputPath, (err) => {
        if (err) console.error('[Cleanup] Error deleting local temp file:', err);
      });

      return res.status(200).json({
        success: true,
        message: 'Video rendered and uploaded to CDN successfully!',
        videoUrl: uploadResult.secure_url,
        duration: durationInFrames / 30, // Duration in seconds
      });
    } else {
      // Local fallback: Serve file via Express static hosting
      const port = process.env.PORT || 5000;
      // Resolve absolute server host
      const host = req.get('host') || `localhost:${port}`;
      const protocol = req.protocol || 'http';
      const videoUrl = `${protocol}://${host}/api/video/download/${filename}`;

      return res.status(200).json({
        success: true,
        message: 'Video rendered locally successfully!',
        videoUrl,
        duration: durationInFrames / 30,
      });
    }
  } catch (error) {
    console.error('[Video API Error] Render pipeline failed:', error);
    return res.status(500).json({
      error: 'Failed to generate visualizer video',
      details: error.message,
    });
  }
};
