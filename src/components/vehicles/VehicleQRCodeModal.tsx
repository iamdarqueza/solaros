"use client";
import React, { useRef, useCallback } from 'react';
import QRCode from 'react-qr-code';
import { Modal } from '@/components/ui/modal';
import { toCanvas } from 'qrcode';

interface VehicleQRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  plateNumber: string;
  vehicleName?: string;
}

export default function VehicleQRCodeModal({
  isOpen,
  onClose,
  plateNumber,
  vehicleName
}: VehicleQRCodeModalProps) {
  const qrRef = useRef<HTMLDivElement>(null);

  const downloadQRCode = useCallback(async () => {
    try {
      // Create a canvas element
      const canvas = document.createElement('canvas');
      
      // Generate QR code on canvas with high quality
      await toCanvas(canvas, plateNumber, {
        width: 512,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      // Create download link
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = url;
      link.download = `QR-${plateNumber}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error generating QR code for download:', error);
      // Fallback method using SVG to canvas conversion
      try {
        await downloadQRCodeFallback();
      } catch (fallbackError) {
        console.error('Fallback download method also failed:', fallbackError);
        alert('Failed to download QR code. Please try again.');
      }
    }
  }, [plateNumber]);

  const downloadQRCodeFallback = useCallback(async () => {
    if (!qrRef.current) return;

    const svg = qrRef.current.querySelector('svg');
    if (!svg) return;

    // Convert SVG to canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      canvas.width = 512;
      canvas.height = 512;
      
      // Fill white background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw the QR code
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // Download
      const downloadUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `QR-${plateNumber}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
    };

    img.src = url;
  }, [plateNumber]);

  const copyPlateNumber = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(plateNumber);
      // You could add a toast notification here
      alert('Plate number copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy plate number:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = plateNumber;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Plate number copied to clipboard!');
    }
  }, [plateNumber]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="w-96">
      <div className="p-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Vehicle QR Code
          </h3>
          
          {vehicleName && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {vehicleName}
            </p>
          )}

          <div className="bg-white p-6 rounded-lg border-2 border-gray-200 dark:border-gray-600 mb-6 inline-block">
            <div ref={qrRef}>
              <QRCode
                value={plateNumber}
                size={200}
                bgColor="#FFFFFF"
                fgColor="#000000"
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Plate Number
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={plateNumber}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-center font-mono text-lg font-bold dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              />
              <button
                onClick={copyPlateNumber}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                title="Copy plate number"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              Close
            </button>
            <button
              onClick={downloadQRCode}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download QR Code
            </button>
          </div>

          <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
            QR code contains: {plateNumber}
          </div>
        </div>
      </div>
    </Modal>
  );
} 