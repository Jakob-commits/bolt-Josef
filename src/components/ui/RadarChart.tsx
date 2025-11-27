interface RadarChartProps {
  data: { label: string; value: number; }[];
  size?: number;
}

export function RadarChart({ data, size = 300 }: RadarChartProps) {
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size / 2.5;
  const levels = 5;
  const maxValue = 10;
  const angleStep = (Math.PI * 2) / data.length;

  const getPoint = (value: number, index: number) => {
    const angle = angleStep * index - Math.PI / 2;
    const r = (value / maxValue) * radius;
    return { x: centerX + r * Math.cos(angle), y: centerY + r * Math.sin(angle) };
  };

  const getLevelPoints = (level: number) => {
    return data.map((_, index) => {
      const angle = angleStep * index - Math.PI / 2;
      const r = (level / levels) * radius;
      return `${centerX + r * Math.cos(angle)},${centerY + r * Math.sin(angle)}`;
    }).join(' ');
  };

  const dataPoints = data.map((item, index) => {
    const point = getPoint(item.value, index);
    return `${point.x},${point.y}`;
  }).join(' ');

  return (
    <div className="w-full flex justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="max-w-full h-auto">
        {[...Array(levels)].map((_, i) => (
          <polygon key={i} points={getLevelPoints(i + 1)} fill="none" stroke="#e5e7eb" strokeWidth="1" />
        ))}
        {data.map((_, index) => {
          const angle = angleStep * index - Math.PI / 2;
          const x = centerX + radius * Math.cos(angle);
          const y = centerY + radius * Math.sin(angle);
          return <line key={index} x1={centerX} y1={centerY} x2={x} y2={y} stroke="#e5e7eb" strokeWidth="1" />;
        })}
        <polygon points={dataPoints} fill="url(#gradient)" fillOpacity="0.5" stroke="url(#gradient)" strokeWidth="2" />
        {data.map((item, index) => {
          const point = getPoint(item.value, index);
          return <circle key={index} cx={point.x} cy={point.y} r="4" fill="#06B6D4" />;
        })}
        {data.map((item, index) => {
          const angle = angleStep * index - Math.PI / 2;
          const labelRadius = radius + 30;
          const x = centerX + labelRadius * Math.cos(angle);
          const y = centerY + labelRadius * Math.sin(angle);
          return <text key={index} x={x} y={y} textAnchor="middle" dominantBaseline="middle" className="text-xs fill-gray-700 font-medium">{item.label}</text>;
        })}
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06B6D4" />
            <stop offset="100%" stopColor="#A855F7" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
