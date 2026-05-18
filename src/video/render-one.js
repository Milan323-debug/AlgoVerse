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

const ALGORITHMS = {
  'bubble-sort': { arrayData: [64, 34, 25, 12, 22] },
  'selection-sort': { arrayData: [64, 34, 25, 12, 22] },
  'insertion-sort': { arrayData: [64, 34, 25, 12, 22] },
  'merge-sort': { arrayData: [64, 34, 25, 12, 22] },
  'quick-sort': { arrayData: [64, 34, 25, 12, 22] },
  'binary-search': { arrayData: [12, 22, 25, 34, 64], target: 25 },
  'bst-insert': { target: 5 },
};

async function main() {
  const algoId = process.argv[2];
  if (!algoId || !ALGORITHMS[algoId]) {
    console.error(`❌ Invalid algorithm ID: ${algoId}`);
    process.exit(1);
  }

  const { arrayData, target } = ALGORITHMS[algoId];
  console.log(`📹 Rendering [${algoId}]...`);

  // Calculate dynamic duration
  let steps = [];
  if (algoId === 'bubble-sort') steps = generateBubbleSortSteps(arrayData);
  else if (algoId === 'selection-sort') steps = generateSelectionSortSteps(arrayData);
  else if (algoId === 'insertion-sort') steps = generateInsertionSortSteps(arrayData);
  else if (algoId === 'merge-sort') steps = generateMergeSortSteps(arrayData);
  else if (algoId === 'quick-sort') steps = generateQuickSortSteps(arrayData);
  else if (algoId === 'binary-search') steps = generateBinarySearchSteps(arrayData, target);
  else if (algoId === 'bst-insert') steps = generateBSTInsertSteps(target);

  const framesPerStep = 45;
  const durationInFrames = Math.max(steps.length * framesPerStep, 45);
  console.log(`   - Steps: ${steps.length}, Frames: ${durationInFrames} (${(durationInFrames/30).toFixed(1)}s)`);

  const entryPoint = path.resolve('./src/video/index.js');
  const bundleLocation = await bundle({ entryPoint });

  const composition = await selectComposition({
    serveUrl: bundleLocation,
    id: 'AlgoVisualizer',
    inputProps: { algoId, arrayData, target },
  });

  const localOutPath = path.resolve(`./out/${algoId}.mp4`);
  const destPath = path.resolve(`../Algoverse/assets/videos/${algoId}.mp4`);

  // Ensure directories
  fs.mkdirSync(path.dirname(localOutPath), { recursive: true });
  fs.mkdirSync(path.dirname(destPath), { recursive: true });

  await renderMedia({
    composition: {
      ...composition,
      durationInFrames,
    },
    serveUrl: bundleLocation,
    codec: 'h264',
    outputLocation: localOutPath,
    inputProps: { algoId, arrayData, target },
  });

  console.log(`✅ Rendered ${algoId}.mp4 successfully!`);
  fs.copyFileSync(localOutPath, destPath);
  console.log(`🚚 Copied to frontend assets: ${destPath}`);
}

main().catch(err => {
  console.error(`❌ Render failed for ${process.argv[2]}:`, err);
  process.exit(1);
});
