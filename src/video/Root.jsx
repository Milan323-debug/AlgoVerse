import React from 'react';
import { Composition } from 'remotion';
import { AlgoVisualizer } from './AlgoVisualizer.jsx';

export const Root = () => {
  return (
    <>
      <Composition
        id="AlgoVisualizer"
        component={AlgoVisualizer}
        durationInFrames={450} // Default 15 seconds at 30fps (overridden dynamically during rendering)
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          algoId: 'bubble-sort',
          arrayData: [64, 34, 25, 12, 22],
          target: 23,
        }}
      />
    </>
  );
};
