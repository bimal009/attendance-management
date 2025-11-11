'use client';
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { 
  LogIn, 
  LogOut, 
  Clock, 
  Phone,
  RefreshCw,
  MapPin
} from 'lucide-react';

const toNepaliTime = (dateString, options = {}) => {
  if (!dateString) return 'N/A';
  
  try {
    if (typeof dateString === 'string' && (dateString.includes('AM') || dateString.includes('PM'))) {
      return dateString;
    }
    
    return new Date(dateString).toLocaleString('en-NP', { 
      timeZone: 'Asia/Kathmandu',
      ...options
    });
  } catch (error) {
    console.error('Error converting time:', error);
    return 'Invalid Date';
  }
};

export default function EmployeeAttendance() {
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleAttendance = async (action) => {
    console.log(`\n🚀 Starting ${action} process...`);
    setMessage('');
    setError('');

    try {
      // Get current location
      console.log('📍 Getting current location...');
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });

      const { latitude, longitude } = position.coords;
      console.log('✓ Location obtained:', { latitude, longitude });

      // Use separate endpoints for check-in and check-out
      const endpoint = action === 'check-in' 
        ? '/api/attendance/checkin' 
        : '/api/attendance/checkout';

      console.log(`📤 Sending ${action} request to ${endpoint}...`);
      
      // Make API call
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone,
          lat: latitude,
          lng: longitude
        }),
      });

      const data = await response.json();
      console.log('📥 API Response:', {
        status: response.status,
        ok: response.ok,
        data
      });

      if (response.ok) {
        const employeeName = data.attendance?.employeeId?.name || 'Employee';
        
        if (action === 'check-in') {
          setMessage(`✓ Checked in successfully, ${employeeName}! Time: ${data.attendance?.checkIn?.time}`);
        } else {
          setMessage(`✓ Checked out successfully, ${employeeName}! Total hours: ${data.totalHours}h`);
        }
        
        console.log('✓ Success!');
        
        // Clear message after 5 seconds
        setTimeout(() => setMessage(''), 5000);
      } else {
        console.error('❌ Request failed:', data.error);
        setError(data.error || `Failed to ${action}`);
        
        // Clear error after 5 seconds
        setTimeout(() => setError(''), 5000);
      }
    } catch (error) {
      console.error('❌ Attendance error:', error);
      
      if (error.code === 1) {
        setError('Location access is required. Please enable location services.');
      } else if (error.code === 3) {
        setError('Location request timed out. Please try again.');
      } else if (error.code === 2) {
        setError('Location information is unavailable. Please check your device settings.');
      } else {
        setError('Failed to mark attendance: ' + error.message);
      }
      
      // Clear error after 5 seconds
      setTimeout(() => setError(''), 5000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 p-4">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-3">
            <Clock className="w-8 h-8" />
            Attendance System
          </h1>
          <p className="text-gray-600">Mark your daily attendance</p>
        </div>

        <Card className="w-full shadow-lg">
          <CardHeader className="bg-blue-50 border-b">
            <CardTitle className="text-center flex items-center justify-center gap-2 text-blue-800">
              <LogIn className="w-5 h-5" />
              Mark Your Attendance
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="phone" className="flex items-center gap-2 mb-2 text-gray-700">
                  <Phone className="w-4 h-4" />
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter your registered phone number"
                  required
                  className="w-full"
                  maxLength={10}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter your 10-digit phone number
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button 
                  onClick={() => handleAttendance('check-in')}
                  className="w-full bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!phone || phone.length < 10}
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Check In
                </Button>

                <Button 
                  onClick={() => handleAttendance('check-out')}
                  className="w-full bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!phone || phone.length < 10}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Check Out
                </Button>
              </div>

              <div className="text-xs text-gray-500 space-y-1 p-3 bg-gray-50 rounded-md">
                <p className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  Ensure location services are enabled
                </p>
                <p>• You must be within 100m of office to mark attendance</p>
                <p>• Check in when arriving, check out when leaving</p>
                <p>• Only one check-in allowed per day</p>
              </div>

              {message && (
                <div className="p-3 bg-green-100 text-green-800 rounded-md text-sm border border-green-200">
                  {message}
                </div>
              )}

              {error && (
                <div className="p-3 bg-red-100 text-red-800 rounded-md text-sm border border-red-200">
                  {error}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-6 p-3 bg-white rounded-lg shadow-sm">
          <p className="text-sm text-gray-600">
            Current Nepal Time: {toNepaliTime(new Date().toISOString(), { 
              dateStyle: 'medium', 
              timeStyle: 'medium' 
            })}
          </p>
        </div>
      </div>
    </div>
  );
}