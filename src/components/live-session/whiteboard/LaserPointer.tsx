import React, { useState, useEffect, useCallback } from 'react';
import { Point } from './types';

interface LaserPointerProps {
  isActive: boolean;
  color?: string;
}

export function LaserPointer({ isActive, color = '#ef4444' }: LaserPointerProps) {
  const [position, setPosition] = useState<Point | null>(null);
  const [trail, setTrail] = useState<Point[]>([]);

  useEffect(() => {
    if (!isActive) {
      setPosition(null);
      setTrail([]);
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      const newPos = { x: e.clientX, y: e.clientY };
      setPosition(newPos);
      setTrail(prev => {
        const updated = [...prev, newPos];
        // Keep only last 20 points for smooth trail
        return updated.slice(-20);
      });
    };

    const handleMouseLeave = () => {
      setPosition(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [isActive]);

  // Fade out trail effect
  useEffect(() => {
    if (!isActive || trail.length === 0) return;

    const interval = setInterval(() => {
      setTrail(prev => prev.slice(1));
    }, 50);

    return () => clearInterval(interval);
  }, [isActive, trail.length > 0]);

  if (!isActive || !position) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999]">
      {/* Trail */}
      <svg className="absolute inset-0 w-full h-full">
        {trail.length > 1 && (
          <polyline
            points={trail.map(p => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.5"
          />
        )}
      </svg>

      {/* Main dot */}
      <div
        className="absolute w-4 h-4 rounded-full animate-pulse"
        style={{
          left: position.x - 8,
          top: position.y - 8,
          backgroundColor: color,
          boxShadow: `0 0 20px ${color}, 0 0 40px ${color}, 0 0 60px ${color}`,
        }}
      />

      {/* Glow ring */}
      <div
        className="absolute w-8 h-8 rounded-full animate-ping"
        style={{
          left: position.x - 16,
          top: position.y - 16,
          backgroundColor: color,
          opacity: 0.3,
        }}
      />
    </div>
  );
}