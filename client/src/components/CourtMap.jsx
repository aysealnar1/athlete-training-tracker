import { useRef, useCallback } from 'react';

const COURT_COLOR = '#1a3d2e';
const COURT_LINE = '#2d5a47';
const LINE_WIDTH = 0.6;

export default function CourtMap({ points = [], onPointAdd, maxPoints = 2, disabled }) {
  const svgRef = useRef(null);

  const getCoords = useCallback((e) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    return { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) };
  }, []);

  const handleClick = (e) => {
    if (disabled) return;
    const coord = getCoords(e);
    if (!coord) return;
    if (maxPoints !== null && points.length >= maxPoints) return;
    onPointAdd(coord);
  };

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid meet"
      onClick={handleClick}
      style={{
        width: '100%',
        height: '100%',
        minHeight: 360,
        cursor: disabled ? 'default' : 'crosshair',
        borderRadius: 10,
        border: `2px solid ${COURT_LINE}`,
      }}
    >
      {/* Yarı saha - Arka plan rengini ve hover efektini bu rect üzerinden net bir şekilde yönetiyoruz */}
      <rect 
        className={disabled ? "" : "court-region"} 
        x="0" 
        y="0" 
        width="100" 
        height="100" 
        fill={COURT_COLOR} 
        stroke={COURT_LINE} 
        strokeWidth={LINE_WIDTH} 
      />
      {/* Üst çizgi (orta saha) */}
      <line x1="0" y1="0" x2="100" y2="0" stroke={COURT_LINE} strokeWidth={LINE_WIDTH} />
      {/* Yan çizgiler */}
      <line x1="0" y1="0" x2="0" y2="100" stroke={COURT_LINE} strokeWidth={LINE_WIDTH} />
      <line x1="100" y1="0" x2="100" y2="100" stroke={COURT_LINE} strokeWidth={LINE_WIDTH} />
      {/* Alt çizgi (baseline) */}
      <line x1="0" y1="100" x2="100" y2="100" stroke={COURT_LINE} strokeWidth={LINE_WIDTH} />
      {/* Üçlük çizgisi (yay) - 180° çevrili (pota tarafına bakan yay) */}
      <path d="M 10 100 A 42 42 0 0 1 90 100" fill="none" stroke={COURT_LINE} strokeWidth={LINE_WIDTH} />
      {/* Serbest atış alanı (key) - dikdörtgen */}
      <rect x="35" y="68" width="30" height="32" fill="none" stroke={COURT_LINE} strokeWidth={LINE_WIDTH} />
      {/* Serbest atış dairesi */}
      <circle cx="50" cy="68" r="9" fill="none" stroke={COURT_LINE} strokeWidth={LINE_WIDTH} />
      {/* Pota halkası */}
      <circle cx="50" cy="90" r="3.5" fill="none" stroke={COURT_LINE} strokeWidth={LINE_WIDTH * 1.2} />

      {/* İşaretlenen noktalar ve çizgiler */}
      {points.length > 0 && (
        <g>
          {points.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r="2.5" fill="var(--accent)" stroke="#fff" strokeWidth="0.6" />
          ))}
          {points.length >= 2 && points.map((p, i) => {
            if (i === 0) return null;
            const prev = points[i - 1];
            return (
              <line key={`line-${i}`} x1={prev.x} y1={prev.y} x2={p.x} y2={p.y} stroke="var(--accent)" strokeWidth="0.8" strokeDasharray="1.5,1.5" />
            );
          })}
        </g>
      )}
    </svg>
  );
}