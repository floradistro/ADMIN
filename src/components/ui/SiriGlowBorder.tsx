'use client'

import React from 'react'

interface SiriGlowBorderProps {
  isLoading?: boolean
  className?: string
}

export const SiriGlowBorder: React.FC<SiriGlowBorderProps> = ({
  isLoading = false,
  className = ''
}) => {
  return (
    <div
      className={`siri-border ${isLoading ? 'active' : 'idle'} ${className}`}
      style={{
        position: 'absolute',
        top: '-2px',
        left: '-2px',
        right: '-2px', 
        bottom: '-2px',
        zIndex: 1,
        pointerEvents: 'none',
        border: '2px solid transparent',
        borderRadius: '12px', // Match chat interface border radius
        background: isLoading 
          ? 'linear-gradient(45deg, #007AFF, #5856D6, #AF52DE, #FF2D55, #5AC8FA, #34C759) border-box'
          : 'rgba(255, 255, 255, 0.1) border-box',
        WebkitMask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
        WebkitMaskComposite: 'xor',
        mask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
        maskComposite: 'exclude',
        animation: isLoading 
          ? 'siriGlow 3s ease-in-out infinite' 
          : 'idleGlow 6s ease-in-out infinite',
        transform: 'translateZ(0)',
        willChange: 'transform, opacity',
        boxSizing: 'border-box',
      }}
    />
  )
}

export default SiriGlowBorder