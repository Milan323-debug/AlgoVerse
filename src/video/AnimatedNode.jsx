import React from 'react';
import { spring, useCurrentFrame, useVideoConfig } from 'remotion';

export const AnimatedNode = ({ 
  value, 
  status = 'neutral', 
  translateX = 0, 
  translateY = 0,
  style = {} 
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Gentle entry scaling animation for the nodes
  const scale = spring({
    frame,
    fps,
    config: { damping: 12, mass: 0.5 },
  });

  // Design tokens based on the node's operational state
  const theme = {
    active: {
      background: 'linear-gradient(135deg, #FF3366, #FF6B8B)',
      borderColor: 'rgba(255, 51, 102, 0.4)',
      boxShadow: '0 0 40px rgba(255, 51, 102, 0.6), inset 0 0 10px rgba(255, 255, 255, 0.3)',
      color: '#ffffff',
    },
    target: {
      background: 'linear-gradient(135deg, #00FF88, #00FFCC)',
      borderColor: 'rgba(0, 255, 136, 0.4)',
      boxShadow: '0 0 40px rgba(0, 255, 136, 0.6), inset 0 0 10px rgba(255, 255, 255, 0.3)',
      color: '#02150D',
    },
    pivot: {
      background: 'linear-gradient(135deg, #FF8C00, #FFA500)',
      borderColor: 'rgba(255, 140, 0, 0.4)',
      boxShadow: '0 0 40px rgba(255, 140, 0, 0.6), inset 0 0 10px rgba(255, 255, 255, 0.3)',
      color: '#ffffff',
    },
    highlight: {
      background: 'linear-gradient(135deg, #8A2BE2, #9370DB)',
      borderColor: 'rgba(138, 43, 226, 0.4)',
      boxShadow: '0 0 30px rgba(138, 43, 226, 0.5), inset 0 0 10px rgba(255, 255, 255, 0.2)',
      color: '#ffffff',
    },
    neutral: {
      background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.85))',
      borderColor: 'rgba(255, 255, 255, 0.08)',
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3), inset 0 0 15px rgba(255, 255, 255, 0.03)',
      color: '#E2E8F0',
    }
  };

  const selectedTheme = theme[status] || theme.neutral;

  return (
    <div
      style={{
        width: 100,
        height: 100,
        borderRadius: 24,
        background: selectedTheme.background,
        border: `2px solid ${selectedTheme.borderColor}`,
        boxShadow: selectedTheme.boxShadow,
        color: selectedTheme.color,
        fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif",
        fontSize: 36,
        fontWeight: 800,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        transform: `scale(${scale}) translate(${translateX}px, ${translateY}px)`,
        textShadow: status === 'target' ? 'none' : '0 2px 4px rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(10px)',
        position: 'relative',
        zIndex: status !== 'neutral' ? 10 : 1,
        transition: 'background 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease',
        ...style,
      }}
    >
      {value}
    </div>
  );
};
