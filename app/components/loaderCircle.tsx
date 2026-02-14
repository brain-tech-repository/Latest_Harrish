"use client";

import React from "react";

type Props = {
  fullScreen?: boolean;
  className?: string;
  size?: number;
  width?: number;
};

export default function LoaderCircle({ fullScreen = false, className = "", size = 70, width }: Props) {
  const outerSize = Math.max(8, typeof width === "number" ? width : size);
  // inner size is proportional to original (40/70)
  const innerSize = Math.round((40 / 70) * outerSize);
  // border scales proportionally (original 5px at 70px)
  const borderWidth = Math.max(1, (5 * outerSize) / 70);

  const containerStyle: React.CSSProperties = {
    width: outerSize,
    height: outerSize,
  };

  const outerStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    borderRadius: "50%",
    borderStyle: "solid",
    position: "absolute",
    top: 0,
    left: 0,
    borderWidth: borderWidth,
    borderColor: "transparent",
    borderTopColor: "#009688",
    borderRightColor: "#009688",
    boxSizing: "border-box",
  };

  // inner wrapper centers the inner rotating element using translate
  const innerWrapperStyle: React.CSSProperties = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: innerSize,
    height: innerSize,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  const innerElementStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    borderRadius: "50%",
    borderStyle: "solid",
    borderWidth: borderWidth,
    borderColor: "transparent",
    borderTopColor: "#e91e63",
    borderRightColor: "#e91e63",
    boxSizing: "border-box",
  };

  return (
    <div className={`${fullScreen ? "flex items-center justify-center h-screen bg-[#202628]" : ""}`}>
      <div className={`relative ${className}`} style={containerStyle}>
        <div style={outerStyle} className="loader-spin" />
        <div style={innerWrapperStyle}>
          <div style={innerElementStyle} className="loader-spin-reverse" />
        </div>
      </div>
    </div>
  );
}
