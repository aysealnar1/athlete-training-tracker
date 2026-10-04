import { useRef } from 'react';
import courtImage from '../assets/saha.webp';
import { fullCourtCoordinates, fullCourtDisplayPoint, FULL_COURT } from '../utils/court-coordinates';

export default function CourtMap({ points = [], onPointAdd, maxPoints = 2, disabled }) {
  const svgRef = useRef(null);
  const visiblePoints = points.map(fullCourtDisplayPoint);
  const handleClick = (event) => {
    if (disabled || (maxPoints !== null && points.length >= maxPoints)) return;
    const point = fullCourtCoordinates(svgRef.current.getBoundingClientRect(), event.clientX, event.clientY);
    if (point) onPointAdd(point);
  };
  return (
    <svg ref={svgRef} viewBox={`0 0 ${FULL_COURT.width} ${FULL_COURT.height}`}
      preserveAspectRatio="none" onClick={handleClick}
      aria-label="Tam basketbol sahası şut haritası"
      style={{ width: '100%', height: '100%', display: 'block', minHeight: 0,
        borderRadius: 12, cursor: disabled ? 'default' : 'crosshair' }}>
      <image href={courtImage} width={FULL_COURT.width} height={FULL_COURT.height} />
      <g pointerEvents="none">
        {visiblePoints.slice(1).map((point, index) => (
          <line key={`line-${index}`} x1={visiblePoints[index].x} y1={visiblePoints[index].y}
            x2={point.x} y2={point.y} stroke="#ff923e" strokeWidth="5" strokeDasharray="12 10" />
        ))}
        {visiblePoints.map((point, index) => (
          <g key={index}>
            <circle cx={point.x} cy={point.y} r="17" fill="#ff923e" stroke="#fff" strokeWidth="4" />
            <text x={point.x} y={point.y + 5} textAnchor="middle" fill="#17202c" fontSize="16" fontWeight="700">{index + 1}</text>
          </g>
        ))}
      </g>
    </svg>
  );
}
