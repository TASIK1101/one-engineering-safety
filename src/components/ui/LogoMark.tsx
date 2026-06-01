"use client";

import { useState } from "react";

type Props = {
  size?: number;
  className?: string;
};

export default function LogoMark({ size = 40, className = "" }: Props) {
  const [imgError, setImgError] = useState(false);
  const fontSize = Math.round(size * 0.36);

  if (!imgError) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src="/logo/one-engineering-logo.png"
        alt="주식회사 원엔지니어링"
        width={size}
        height={size}
        className={`shrink-0 object-contain ${className}`}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      aria-label="주식회사 원엔지니어링"
    >
      <circle cx="20" cy="20" r="20" fill="#1e3a5f" />
      <text
        x="20"
        y="20"
        dominantBaseline="central"
        textAnchor="middle"
        fill="white"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontWeight="700"
        fontSize={fontSize}
        letterSpacing="0.5"
      >
        1E
      </text>
    </svg>
  );
}
