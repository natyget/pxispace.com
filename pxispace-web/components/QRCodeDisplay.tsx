"use client";

import { QRCodeSVG } from "qrcode.react";

interface QRCodeDisplayProps {
  url: string;
  size?: number;
}

export function QRCodeDisplay({ url, size = 200 }: QRCodeDisplayProps) {
  return (
    <div className="bg-white p-4 rounded-xl inline-block">
      <QRCodeSVG value={url} size={size} level="M" />
    </div>
  );
}

