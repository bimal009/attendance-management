'use client';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import React, { useState, useEffect } from 'react';

export default function QRCodePage() {
  const [qrCode, setQrCode] = useState('');
  const [attendanceUrl, setAttendanceUrl] = useState('');

  const generateQRCode = async () => {
    try {
      const response = await fetch('/api/qr-code');
      const data = await response.json();
      setQrCode(data.qrCode);
      setAttendanceUrl(data.attendanceUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  useEffect(() => {
    generateQRCode();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">QR Code Generator</h1>

        <Card>
          <CardHeader>
            <CardTitle>Attendance QR Code</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-4">
            {qrCode ? (
              <>
                <img src={qrCode} alt="Attendance QR Code" className="w-64 h-64" />
                <p className="text-sm text-gray-600">
                  Scan this QR code to mark attendance
                </p>
                <div className="text-center">
                  <p className="text-sm font-medium">Attendance URL:</p>
                  <a 
                    href={attendanceUrl} 
                    className="text-blue-600 hover:underline text-sm break-all"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {attendanceUrl}
                  </a>
                </div>
              </>
            ) : (
              <p>Generating QR code...</p>
            )}
            
            <Button onClick={generateQRCode} variant="outline">
              Regenerate QR Code
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}