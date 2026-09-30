import { useState } from 'react';
import { StyleSheet, Pressable } from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

const COURT_COLOR = '#1a3d2e';
const COURT_LINE = '#2d5a47';
const LINE_WIDTH = 0.6;

export default function CourtMap({ points = [], onPointAdd, maxPoints = 2, disabled }) {
  const [layout, setLayout] = useState({ width: 300, height: 300 });

  const handlePress = (evt) => {
    if (disabled) return;
    if (maxPoints !== null && points.length >= maxPoints) return;
    const { locationX, locationY } = evt.nativeEvent;
    const x = (locationX / layout.width) * 100;
    const y = (locationY / layout.height) * 100;
    onPointAdd({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
  };

  return (
    <Pressable
      style={[styles.court, disabled && styles.courtDisabled]}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        if (width > 0 && height > 0) setLayout({ width, height });
      }}
      onPress={handlePress}
    >
      <Svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" style={StyleSheet.absoluteFill}>
        <Rect x="0" y="0" width="100" height="100" fill={COURT_COLOR} stroke={COURT_LINE} strokeWidth={LINE_WIDTH} />
        <Line x1="0" y1="0" x2="100" y2="0" stroke={COURT_LINE} strokeWidth={LINE_WIDTH} />
        <Line x1="0" y1="0" x2="0" y2="100" stroke={COURT_LINE} strokeWidth={LINE_WIDTH} />
        <Line x1="100" y1="0" x2="100" y2="100" stroke={COURT_LINE} strokeWidth={LINE_WIDTH} />
        <Line x1="0" y1="100" x2="100" y2="100" stroke={COURT_LINE} strokeWidth={LINE_WIDTH} />
        <Path d="M 10 100 A 42 42 0 0 1 90 100" fill="none" stroke={COURT_LINE} strokeWidth={LINE_WIDTH} />
        <Rect x="35" y="68" width="30" height="32" fill="none" stroke={COURT_LINE} strokeWidth={LINE_WIDTH} />
        <Circle cx="50" cy="68" r="9" fill="none" stroke={COURT_LINE} strokeWidth={LINE_WIDTH} />
        <Circle cx="50" cy="90" r="3.5" fill="none" stroke={COURT_LINE} strokeWidth={LINE_WIDTH * 1.2} />
        {points.map((p, i) => (
          <Circle key={i} cx={p.x} cy={p.y} r="2.5" fill="#58a6ff" stroke="#fff" strokeWidth="0.6" />
        ))}
        {points.length >= 2 && points.map((p, i) => {
          if (i === 0) return null;
          const prev = points[i - 1];
          return <Line key={`l-${i}`} x1={prev.x} y1={prev.y} x2={p.x} y2={p.y} stroke="#58a6ff" strokeWidth="0.8" strokeDasharray="1.5,1.5" />;
        })}
      </Svg>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  court: { width: '100%', minHeight: 320, borderRadius: 10, borderWidth: 2, borderColor: COURT_LINE, overflow: 'hidden' },
  courtDisabled: { opacity: 0.8 },
});
