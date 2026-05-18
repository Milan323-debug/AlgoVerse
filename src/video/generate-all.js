import path from 'path';
import fs from 'fs';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import {
  generateBubbleSortSteps,
  generateSelectionSortSteps,
  generateInsertionSortSteps,
  generateMergeSortSteps,
  generateQuickSortSteps,
  generateBinarySearchSteps,
  generateBSTInsertSteps,
} from './data-helpers.js';

const ALGORITHMS = [
  { id: 'bubble-sort', arrayData: [64, 34, 25, 12, 22] },
  { id: 'selection-sort', arrayData: [64, 34, 25, 12, 22] },
  { id: 'insertion-sort', arrayData: [64, 34, 25, 12, 22] },
  { id: 'merge-sort', arrayData: [64, 34, 25, 12, 22] },
  { id: 'quick-sort', arrayData: [64, 34, 25, 12, 22] },
  { id: 'binary-search', arrayData: [12, 22, 25, 34, 64], target: 25 },
  { id: 'bst-insert', target: 5 },
];

async function main() {
  console.log('🚀 Starting pre-rendering pipeline for all 7 algorithms...');
  
  // 1. Bundle entrypoint
  const entryPoint = path.resolve('./src/video/index.js');
  console.log('📦 Bundling Remotion project...');
  const bundleLocation = await bundle({ entryPoint });
  console.log('✅ Bundling completed successfully!');

  // Ensure output directories exist
  const backendOutDir = path.resolve('./out');
  if (!fs.existsSync(backendOutDir)) {
    fs.mkdirSync(backendOutDir, { recursive: true });
  }

  const frontendOutDir = path.resolve('../Algoverse/assets/videos');
  if (!fs.existsSync(frontendOutDir)) {
    fs.mkdirSync(frontendOutDir, { recursive: true });
  }

  for (const algo of ALGORITHMS) {
    const { id, arrayData, target } = algo;
    console.log(`\n📹 Rendering [${id}]...`);

    // Calculate dynamic duration
    let steps = [];
    if (id === 'bubble-sort') steps = generateBubbleSortSteps(arrayData);
    else if (id === 'selection-sort') steps = generateSelectionSortSteps(arrayData);
    else if (id === 'insertion-sort') steps = generateInsertionSortSteps(arrayData);
    else if (id === 'merge-sort') steps = generateMergeSortSteps(arrayData);
    else if (id === 'quick-sort') steps = generateQuickSortSteps(arrayData);
    else if (id === 'binary-search') steps = generateBinarySearchSteps(arrayData, target);
    else if (id === 'bst-insert') steps = generateBSTInsertSteps(target);

    const framesPerStep = 45;
    const durationInFrames = Math.max(steps.length * framesPerStep, 45);

    console.log(`   - Steps: ${steps.length}, Frames: ${durationInFrames} (${(durationInFrames/30).toFixed(1)}s)`);

    // Select Composition
    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id: 'AlgoVisualizer',
      inputProps: { algoId: id, arrayData, target },
    });

    const localOutPath = path.join(backendOutDir, `${id}.mp4`);
    const destPath = path.join(frontendOutDir, `${id}.mp4`);

    // Render media
    await renderMedia({
      composition: {
        ...composition,
        durationInFrames,
      },
      serveUrl: bundleLocation,
      codec: 'h264',
      outputLocation: localOutPath,
      inputProps: { algoId: id, arrayData, target },
    });

    console.log(`✅ Rendered ${id}.mp4 successfully!`);

    // Copy to frontend assets/videos/
    fs.copyFileSync(localOutPath, destPath);
    console.log(`🚚 Copied to frontend assets: ${destPath}`);
  }

  console.log('\n🎉 ALL VIDEOS PRE-RENDERED AND INTEGRATED SUCCESSFULLY!');
}

main().catch(err => {
  console.error('❌ Pipeline failed:', err);
  process.exit(1);
});
