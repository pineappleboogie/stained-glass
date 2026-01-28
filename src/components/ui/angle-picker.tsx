'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface LightControllerProps {
  /** Current angle value in degrees (0-359) */
  angle: number;
  /** Light elevation/height (0-90 degrees) - controls sun distance from center */
  elevation: number;
  /** Light intensity (0-2) - controls ray visibility */
  intensity: number;
  /** Ambient light (0-1) - controls background brightness */
  ambient: number;
  /** Callback when angle changes */
  onAngleChange: (angle: number) => void;
  /** Size of the controller in pixels */
  size?: number;
  /** Whether the component is disabled */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** ID for label association */
  id?: string;
}

function LightController({
  angle,
  elevation,
  intensity,
  ambient,
  onAngleChange,
  size = 140,
  disabled = false,
  className,
  id,
}: LightControllerProps) {
  const svgRef = React.useRef<SVGSVGElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);

  // ViewBox dimensions
  const viewBoxSize = 100;
  const centerX = viewBoxSize / 2;
  const centerY = viewBoxSize / 2;
  const bgRadius = 40;

  // Calculate sun distance from center based on elevation
  // elevation 0 = close to center, elevation 90 = at edge of circle
  const maxRadius = 36; // just inside the background circle edge
  const minRadius = 16; // close to center
  const sunRadius = minRadius + (elevation / 90) * (maxRadius - minRadius);

  // Convert angle to sun position
  const angleRad = (angle * Math.PI) / 180;
  const sunX = centerX + sunRadius * Math.cos(angleRad);
  const sunY = centerY + sunRadius * Math.sin(angleRad);

  // Calculate light cone - TRIANGLE from sun to spread at center
  const coneSpread = 12 + intensity * 6; // width at the base (at center)
  const perpAngle = angleRad + Math.PI / 2;

  // Cone base points (spread out at center, perpendicular to light direction)
  const coneBaseX1 = centerX + coneSpread * Math.cos(perpAngle);
  const coneBaseY1 = centerY + coneSpread * Math.sin(perpAngle);
  const coneBaseX2 = centerX - coneSpread * Math.cos(perpAngle);
  const coneBaseY2 = centerY - coneSpread * Math.sin(perpAngle);

  // Background color based on ambient - warm earth tone to match panel theme
  // Range: 65% to 88% lightness (max is slightly darker than card bg ~93%)
  const bgLightness = 65 + ambient * 23;
  const backgroundColor = `hsl(30, 15%, ${bgLightness}%)`;

  // Calculate angle from pointer position
  const calculateAngle = React.useCallback(
    (clientX: number, clientY: number) => {
      if (!svgRef.current) return angle;

      const rect = svgRef.current.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * viewBoxSize - centerX;
      const y = ((clientY - rect.top) / rect.height) * viewBoxSize - centerY;

      let newAngle = Math.atan2(y, x) * (180 / Math.PI);
      if (newAngle < 0) newAngle += 360;

      return Math.round(newAngle);
    },
    [angle, viewBoxSize, centerX, centerY]
  );

  const handlePointerDown = React.useCallback(
    (e: React.PointerEvent) => {
      if (disabled) return;
      e.preventDefault();
      setIsDragging(true);
      svgRef.current?.setPointerCapture(e.pointerId);
      onAngleChange(calculateAngle(e.clientX, e.clientY));
    },
    [disabled, calculateAngle, onAngleChange]
  );

  const handlePointerMove = React.useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging || disabled) return;
      onAngleChange(calculateAngle(e.clientX, e.clientY));
    },
    [isDragging, disabled, calculateAngle, onAngleChange]
  );

  const handlePointerUp = React.useCallback(
    () => {
      setIsDragging(false);
    },
    []
  );

  // Keyboard support
  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (disabled) return;

      let newAngle = angle;
      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowUp':
          newAngle = (angle + 1) % 360;
          e.preventDefault();
          break;
        case 'ArrowLeft':
        case 'ArrowDown':
          newAngle = (angle - 1 + 360) % 360;
          e.preventDefault();
          break;
        case 'PageUp':
          newAngle = (angle + 15) % 360;
          e.preventDefault();
          break;
        case 'PageDown':
          newAngle = (angle - 15 + 360) % 360;
          e.preventDefault();
          break;
        case 'Home':
          newAngle = 0;
          e.preventDefault();
          break;
        case 'End':
          newAngle = 359;
          e.preventDefault();
          break;
        default:
          return;
      }
      onAngleChange(newAngle);
    },
    [disabled, angle, onAngleChange]
  );

  // Generate sun rays - smaller size
  const sunRays = React.useMemo(() => {
    const rays = [];
    const rayCount = 8;
    const innerRadius = 4;
    const outerRadius = 7;
    for (let i = 0; i < rayCount; i++) {
      const rayAngle = (i * 360) / rayCount;
      const rad = (rayAngle * Math.PI) / 180;
      rays.push({
        x1: innerRadius * Math.cos(rad),
        y1: innerRadius * Math.sin(rad),
        x2: outerRadius * Math.cos(rad),
        y2: outerRadius * Math.sin(rad),
      });
    }
    return rays;
  }, []);

  const gradientId = `lightGradient-${id || 'default'}`;
  const glowId = `sunGlow-${id || 'default'}`;

  return (
    <svg
      ref={svgRef}
      id={id}
      viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
      width={size}
      height={size}
      className={cn(
        'touch-none select-none outline-none rounded-xl overflow-visible',
        'focus-visible:ring-4 focus-visible:ring-ring/30',
        'transition-shadow duration-150',
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
        className
      )}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onKeyDown={handleKeyDown}
      tabIndex={disabled ? -1 : 0}
      role="slider"
      aria-valuemin={0}
      aria-valuemax={359}
      aria-valuenow={angle}
      aria-label="Light angle"
    >
      <defs>
        {/* Gradient for light cone - from sun to center */}
        <linearGradient
          id={gradientId}
          x1={sunX}
          y1={sunY}
          x2={centerX}
          y2={centerY}
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="hsl(42, 75%, 55%)" stopOpacity={0.95} />
          <stop offset="50%" stopColor="hsl(42, 65%, 50%)" stopOpacity={0.5} />
          <stop offset="100%" stopColor="hsl(40, 55%, 45%)" stopOpacity={0.15} />
        </linearGradient>

        {/* Glow filter for sun */}
        <filter id={glowId} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Background circle */}
      <circle
        cx={centerX}
        cy={centerY}
        r={bgRadius}
        fill={backgroundColor}
        className="transition-[fill] duration-150"
      />

      {/* Inner darker ring for depth */}
      <circle
        cx={centerX}
        cy={centerY}
        r={bgRadius - 2}
        fill="none"
        stroke="currentColor"
        strokeOpacity={0.05}
        strokeWidth={1}
      />

      {/* Orbit track */}
      <circle
        cx={centerX}
        cy={centerY}
        r={sunRadius}
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        strokeDasharray="2 4"
        strokeOpacity={0.35}
      />

      {/* Light cone - TRIANGLE from sun point to spread at center */}
      <polygon
        points={`${sunX},${sunY} ${coneBaseX1},${coneBaseY1} ${coneBaseX2},${coneBaseY2}`}
        fill={`url(#${gradientId})`}
        opacity={Math.min(0.5 + intensity * 0.4, 0.9)}
        style={{ mixBlendMode: 'darken' }}
        className="transition-opacity duration-150"
      />

      {/* Center square (represents the image) */}
      <rect
        x={centerX - 8}
        y={centerY - 8}
        width={16}
        height={16}
        rx={2}
        fill="currentColor"
        fillOpacity={0.15}
        stroke="currentColor"
        strokeOpacity={0.3}
        strokeWidth={1}
      />

      {/* Outer border */}
      <circle
        cx={centerX}
        cy={centerY}
        r={bgRadius}
        fill="none"
        stroke="currentColor"
        strokeOpacity={0.15}
        strokeWidth={1}
      />

      {/* Sun icon group - rendered last so it's on top */}
      <g
        transform={`translate(${sunX}, ${sunY})`}
        filter={`url(#${glowId})`}
        style={{ mixBlendMode: 'hard-light' }}
      >
        {/* Sun body */}
        <circle r={3} fill="hsl(42, 80%, 55%)" />

        {/* Sun rays */}
        {sunRays.map((ray, i) => (
          <line
            key={i}
            x1={ray.x1}
            y1={ray.y1}
            x2={ray.x2}
            y2={ray.y2}
            stroke="hsl(42, 80%, 55%)"
            strokeWidth={1.5}
            strokeLinecap="round"
          />
        ))}
      </g>
    </svg>
  );
}

// Keep the old export name for backwards compatibility during transition
export { LightController, LightController as AnglePicker };
