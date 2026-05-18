import React from 'react';
import { useCurrentFrame, useVideoConfig, spring, AbsoluteFill } from 'remotion';
import { AnimatedNode } from './AnimatedNode.jsx';
import * as helpers from './data-helpers.js';

export const AlgoVisualizer = ({ algoId = 'bubble-sort', arrayData = [64, 34, 25, 12, 22], target = 23 }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // 1. Generate steps based on chosen algorithm
  let steps = [];
  let title = 'Algorithm Visualizer';
  let timeComplexity = 'O(N)';
  let spaceComplexity = 'O(1)';

  switch (algoId) {
    case 'bubble-sort':
      steps = helpers.generateBubbleSortSteps(arrayData);
      title = 'Bubble Sort';
      timeComplexity = 'O(N²)';
      spaceComplexity = 'O(1)';
      break;
    case 'selection-sort':
      steps = helpers.generateSelectionSortSteps(arrayData);
      title = 'Selection Sort';
      timeComplexity = 'O(N²)';
      spaceComplexity = 'O(1)';
      break;
    case 'insertion-sort':
      steps = helpers.generateInsertionSortSteps(arrayData);
      title = 'Insertion Sort';
      timeComplexity = 'O(N²)';
      spaceComplexity = 'O(1)';
      break;
    case 'merge-sort':
      steps = helpers.generateMergeSortSteps(arrayData);
      title = 'Merge Sort';
      timeComplexity = 'O(N log N)';
      spaceComplexity = 'O(N)';
      break;
    case 'quick-sort':
      steps = helpers.generateQuickSortSteps(arrayData);
      title = 'Quick Sort';
      timeComplexity = 'O(N log N)';
      spaceComplexity = 'O(log N)';
      break;
    case 'binary-search':
      steps = helpers.generateBinarySearchSteps(arrayData, target);
      title = 'Binary Search';
      timeComplexity = 'O(log N)';
      spaceComplexity = 'O(1)';
      break;
    case 'bst-insert':
      steps = helpers.generateBSTInsertSteps(target);
      title = 'Binary Search Tree Insertion';
      timeComplexity = 'O(log N)';
      spaceComplexity = 'O(H)';
      break;
    default:
      steps = [{ description: 'No algorithm selected', arrayState: arrayData }];
  }

  // 2. Identify the active step for the current frame
  const framesPerStep = 45; // 1.5 seconds per step for highly readable videos
  const activeStepIdx = Math.min(
    Math.floor(frame / framesPerStep),
    steps.length - 1
  );
  
  const currentStep = steps[activeStepIdx];
  const prevStep = activeStepIdx > 0 ? steps[activeStepIdx - 1] : null;

  // 3. Render Helper: Check if two indices have swapped between prev step and current step
  const swappedIndices = [];
  if (prevStep && prevStep.arrayState && currentStep.arrayState) {
    for (let idx = 0; idx < currentStep.arrayState.length; idx++) {
      if (prevStep.arrayState[idx] !== currentStep.arrayState[idx]) {
        swappedIndices.push(idx);
      }
    }
  }

  // Swap progress spring (ranges from 0 to 1 inside the step duration)
  const stepFrame = frame % framesPerStep;
  const swapSpring = spring({
    frame: stepFrame,
    fps,
    config: { damping: 15, mass: 0.6 }
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#0B0F19',
        color: '#E2E8F0',
        fontFamily: "'Inter', sans-serif",
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '60px 80px',
        boxSizing: 'border-box',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Cinematic Background Glows */}
      <div
        style={{
          position: 'absolute',
          top: -200,
          left: -200,
          width: 800,
          height: 800,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, rgba(0, 0, 0, 0) 70%)',
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: -200,
          right: -200,
          width: 800,
          height: 800,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0, 255, 136, 0.08) 0%, rgba(0, 0, 0, 0) 70%)',
          zIndex: 0,
        }}
      />

      {/* Grid Pattern overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.015) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />

      {/* ─── HEADER SECTION ─── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 5,
        }}
      >
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#00FF88', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>
            AlgoVerse Visualizer
          </div>
          <h1
            style={{
              margin: 0,
              fontSize: 48,
              fontWeight: 900,
              background: 'linear-gradient(to right, #FFFFFF, #94A3B8)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: -1,
            }}
          >
            {title}
          </h1>
        </div>

        {/* Complexity Metadata Dashboard */}
        <div style={{ display: 'flex', gap: 24 }}>
          <div
            style={{
              background: 'rgba(30, 41, 59, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              padding: '12px 24px',
              borderRadius: 16,
              backdropFilter: 'blur(10px)',
            }}
          >
            <div style={{ fontSize: 12, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Time Complexity</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#F59E0B', marginTop: 4 }}>{timeComplexity}</div>
          </div>
          <div
            style={{
              background: 'rgba(30, 41, 59, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              padding: '12px 24px',
              borderRadius: 16,
              backdropFilter: 'blur(10px)',
            }}
          >
            <div style={{ fontSize: 12, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Space Complexity</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#10B981', marginTop: 4 }}>{spaceComplexity}</div>
          </div>
        </div>
      </div>

      {/* ─── VISUAL CANVAS SECTION ─── */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 5,
        }}
      >
        {algoId === 'bst-insert' ? (
          // ─── RENDERING BINARY SEARCH TREE ───
          <div style={{ position: 'relative', width: 900, height: 500 }}>
            {/* SVG connector lines */}
            <svg style={{ position: 'absolute', width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
              <defs>
                <linearGradient id="edgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.15)" />
                  <stop offset="100%" stopColor="rgba(255,255,255,0.05)" />
                </linearGradient>
              </defs>
              {/* Lines from Root (8) to 4 and 12 */}
              <line x1={450} y1={50} x2={270} y2={180} stroke="url(#edgeGrad)" strokeWidth={3} />
              <line x1={450} y1={50} x2={630} y2={180} stroke="url(#edgeGrad)" strokeWidth={3} />

              {/* Lines from 4 to 2 and 6 */}
              <line x1={270} y1={180} x2={150} y2={310} stroke="url(#edgeGrad)" strokeWidth={3} />
              <line x1={270} y1={180} x2={350} y2={310} stroke="url(#edgeGrad)" strokeWidth={3} />

              {/* Lines from 12 to 10 and 14 */}
              <line x1={630} y1={180} x2={550} y2={310} stroke="url(#edgeGrad)" strokeWidth={3} />
              <line x1={630} y1={180} x2={750} y2={310} stroke="url(#edgeGrad)" strokeWidth={3} />
            </svg>

            {/* Render Nodes */}
            {[
              { val: 8, x: 450, y: 50 },
              { val: 4, x: 270, y: 180 },
              { val: 12, x: 630, y: 180 },
              { val: 2, x: 150, y: 310 },
              { val: 6, x: 350, y: 310 },
              { val: 10, x: 550, y: 310 },
              { val: 14, x: 750, y: 310 },
            ].map((node) => {
              let status = 'neutral';
              if (currentStep.activeNode === node.val) status = 'active';
              else if (currentStep.targetNode === node.val) status = 'active';
              else if (currentStep.highlightNodes?.includes(node.val)) status = 'highlight';

              if (currentStep.isFound && currentStep.activeNode === node.val) {
                status = 'target';
              }

              return (
                <AnimatedNode
                  key={node.val}
                  value={node.val}
                  status={status}
                  style={{
                    position: 'absolute',
                    left: node.x - 50,
                    top: node.y - 50,
                    width: 100,
                    height: 100,
                    borderRadius: '50%',
                  }}
                />
              );
            })}
          </div>
        ) : (
          // ─── RENDERING HORIZONTAL ARRAY ───
          <div style={{ display: 'flex', gap: 20, position: 'relative' }}>
            {currentStep.arrayState?.map((num, idx) => {
              // Determine status
              let status = 'neutral';
              if (currentStep.activeNode === idx) status = 'active';
              else if (currentStep.targetNode === idx) status = 'active';
              else if (currentStep.pivotIndex === idx) status = 'pivot';
              else if (currentStep.leftIndices?.includes(idx)) status = 'highlight';
              else if (currentStep.rightIndices?.includes(idx)) status = 'highlight';
              
              if (algoId === 'binary-search') {
                const mid = currentStep.midIndex;
                const low = currentStep.lowIndex;
                const high = currentStep.highIndex;

                if (mid === idx) {
                  status = currentStep.isFound ? 'target' : 'active';
                } else if (idx >= low && idx <= high) {
                  status = 'highlight';
                }
              }

              // Compute swap horizontal spring animations
              let translateX = 0;
              if (swappedIndices.includes(idx)) {
                const otherIdx = swappedIndices.find(sIdx => sIdx !== idx);
                // Pre-swap offset spacing = 120px (node 100px + gap 20px)
                const preSwapOffset = (otherIdx - idx) * 120;
                // Animate from initialOffset back to 0 as swapSpring runs from 0 to 1
                translateX = (1 - swapSpring) * preSwapOffset;
              }

              return (
                <AnimatedNode
                  key={`${idx}-${num}`}
                  value={num}
                  status={status}
                  translateX={translateX}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* ─── DESCRIPTION / SUBTITLES SECTION ─── */}
      <div
        style={{
          zIndex: 5,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.6), rgba(15, 23, 42, 0.8))',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '30px 50px',
            borderRadius: 24,
            width: '100%',
            maxWidth: 1000,
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4), inset 0 0 15px rgba(255,255,255,0.02)',
            backdropFilter: 'blur(15px)',
            display: 'flex',
            alignItems: 'center',
            gap: 30,
            boxSizing: 'border-box',
          }}
        >
          {/* Step Count Badge */}
          <div
            style={{
              background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
              color: '#FFFFFF',
              padding: '12px 24px',
              borderRadius: 16,
              fontWeight: 800,
              fontSize: 16,
              textTransform: 'uppercase',
              letterSpacing: 1.5,
              whiteSpace: 'nowrap',
              boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)',
            }}
          >
            Step {activeStepIdx + 1} / {steps.length}
          </div>

          {/* Step Description */}
          <div
            style={{
              fontSize: 22,
              fontWeight: 500,
              color: '#F8FAFC',
              lineHeight: 1.5,
              flex: 1,
              fontFamily: "'Outfit', 'Inter', sans-serif",
            }}
          >
            {currentStep.description}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
