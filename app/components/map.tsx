import React from "react";

interface MapProps {
  latitude: string | number;
  longitude: string | number;
  title?: string;
  height?: number | string;
  width?: number | string;
  onClick?: boolean;
}

const Map: React.FC<MapProps> = ({ latitude, longitude, title = "", height = 300, width = "100%", onClick = false }) => {
  if (!latitude || !longitude) return null;

  const openInNewTab = () => {
    window.open(`https://www.google.com/maps?q=${latitude},${longitude}`, '_blank', 'noopener,noreferrer');
  };

  const mapIframe = (
    <iframe
      title={title}
      width={width}
      height={height}
      style={{ border: 0, borderRadius: "8px", backgroundColor: "#f0f0f0" }}
      loading="lazy"
      allowFullScreen
      src={`https://www.google.com/maps?q=${latitude},${longitude}&hl=es;z=14&output=embed`}
    />
  );

  return (
    <div>
      <div className="text-[18px] mb-2 font-semibold">{title}</div>
      {onClick ? (
        <div
          style={{ cursor: "pointer", display: "inline-block" }}
          title="Open in Google Maps"
          onClick={openInNewTab}
        >
          {mapIframe}
        </div>
      ) : (
        mapIframe
      )}
    </div>
  );
};

export default Map;