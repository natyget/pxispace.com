'use client';

import { QRCode } from 'antd';
import { useAppPlatform } from '@/hooks/useAppPlatform';

/**
 * On a desktop, the night's own address as a QR code: a phone camera reads it, and the address is the universal link
 * that opens the app. Nothing on a phone, where the page's own "Open in PXI" button does that job. Shown only after
 * the platform is known, so the server HTML carries no code for a device that may not need one.
 *
 * @param {{ url: string }} props
 */
export default function GoEventQr({ url }) {
  const platform = useAppPlatform();
  if (platform !== 'desktop') return null;
  return (
    <figure className="go-qr">
      <span className="go-qr-code">
        <QRCode value={url} size={112} color="#000000" bgColor="#ffffff" errorLevel="M" bordered={false} />
      </span>
      <figcaption className="go-qr-cap">Scan to open in PXI</figcaption>
    </figure>
  );
}
