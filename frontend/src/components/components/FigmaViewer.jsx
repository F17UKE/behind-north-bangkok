"use client";

export default function FigmaViewer({ src, alt, hotspots = [], className = "" }) {
  return (
    <div className={`figma-viewer ${className}`}>
      <img src={src} alt={alt} draggable="false" />
      {hotspots.map((spot) => (
        <button
          key={spot.id}
          type="button"
          aria-label={spot.label || spot.id}
          className="figma-hotspot"
          style={{
            left: `${spot.x}%`,
            top: `${spot.y}%`,
            width: `${spot.w}%`,
            height: `${spot.h}%`,
          }}
          onClick={spot.onClick}
        />
      ))}
    </div>
  );
}
