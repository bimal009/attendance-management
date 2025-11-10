import { NextResponse } from 'next/server';
import QRCode from 'qrcode';

export async function GET() {
  try {
    const attendanceUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/attendance`;
    
    const qrCode = await QRCode.toDataURL(attendanceUrl);
    
    return NextResponse.json({ qrCode, attendanceUrl });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}