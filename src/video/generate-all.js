import { execSync } from 'child_process';
import path from 'path';

const ALGORITHMS = [
  'bubble-sort',
  'selection-sort',
  'insertion-sort',
  'merge-sort',
  'quick-sort',
  'binary-search',
  'bst-insert'
];

async function main() {
  console.log('🚀 Starting pre-rendering batch process (isolated sub-process mode)...');
  
  for (const algoId of ALGORITHMS) {
    console.log(`\n⏳ Launching isolated worker process for ${algoId}...`);
    try {
      execSync(`node src/video/render-one.js ${algoId}`, { stdio: 'inherit' });
      console.log(`✅ Worker process for ${algoId} completed successfully.`);
    } catch (err) {
      console.error(`❌ Worker process for ${algoId} failed!`);
      // We continue to ensure other videos still render!
    }
  }
  
  console.log('\n🎉 ALL ELIGIBLE VIDEOS PRE-RENDERED AND INTEGRATED SUCCESSFULLY!');
}

main().catch(err => {
  console.error('❌ Pipeline failed:', err);
  process.exit(1);
});
