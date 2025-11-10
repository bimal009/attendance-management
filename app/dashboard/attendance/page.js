'use client';
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { LogIn, LogOut, Clock } from 'lucide-react';

export default function AttendancePage() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [checkingStatus, setCheckingStatus] = useState(false);

  // Check today's attendance status
  const checkTodayStatus = async () => {
    if (!phone) return;
    
    setCheckingStatus(true);
    try {
      const response = await fetch('/api/attendance');
      const allAttendance = await response.json();
      
      // Find today's attendance for this phone
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayRecord = allAttendance.find(record => {
        const recordDate = new Date(record.date);
        recordDate.setHours(0, 0, 0, 0);
        return record.employeeId?.phone === phone && 
               recordDate.getTime() === today.getTime();
      });
      
      setTodayAttendance(todayRecord);
    } catch (error) {
      console.error('Error checking status:', error);
    } finally {
      setCheckingStatus(false);
    }
  };

  useEffect(() => {
    if (phone.length >= 10) {
      checkTodayStatus();
    } else {
      setTodayAttendance(null);
    }
  }, [phone]);

  const handleAttendance = async (action) => {
    setLoading(true);
    setMessage('');
    setError('');

    try {
      // Get user's location
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });

      const { latitude, longitude } = position.coords;

      // Submit attendance
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone,
          lat: latitude,
          lng: longitude,
          action
        }),
      });

      const data = await response.json();

      if (response.ok) {
        const employeeName = data.attendance.employeeId.name;
        if (action === 'check-in') {
          setMessage(`✓ Checked in successfully, ${employeeName}!`);
        } else {
          setMessage(`✓ Checked out successfully, ${employeeName}! Total hours: ${data.totalHours}h`);
        }
        setTodayAttendance(data.attendance);
      } else {
        setError(data.error || `Failed to ${action}`);
      }
    } catch (error) {
      if (error.code === error.PERMISSION_DENIED) {
        setError('Location access is required to mark attendance');
      } else if (error.code === error.TIMEOUT) {
        setError('Location request timed out');
      } else {
        setError('Failed to get location: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const canCheckIn = !todayAttendance;
  const canCheckOut = todayAttendance && todayAttendance.status === 'checked-in';

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center flex items-center justify-center gap-2">
            <Clock className="w-6 h-6" />
            Attendance System
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter your phone number"
                required
                disabled={loading}
              />
            </div>

            {/* Status Display */}
            {checkingStatus && (
              <div className="p-3 bg-gray-100 rounded-md text-sm text-center">
                Checking status...
              </div>
            )}

            {todayAttendance && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-md space-y-2">
                <h3 className="font-semibold text-blue-900">Today's Status</h3>
                <div className="text-sm space-y-1">
                  <p className="flex items-center gap-2">
                    <LogIn className="w-4 h-4 text-green-600" />
                    <span>Check In: {todayAttendance.checkIn.time}</span>
                  </p>
                  {todayAttendance.checkOut && (
                    <>
                      <p className="flex items-center gap-2">
                        <LogOut className="w-4 h-4 text-red-600" />
                        <span>Check Out: {todayAttendance.checkOut.time}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-600" />
                        <span className="font-semibold">Total: {todayAttendance.totalHours}h</span>
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button 
                onClick={() => handleAttendance('check-in')}
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={loading || !canCheckIn || !phone}
              >
                <LogIn className="w-4 h-4 mr-2" />
                {loading ? 'Processing...' : 'Check In'}
              </Button>

              <Button 
                onClick={() => handleAttendance('check-out')}
                className="w-full bg-red-600 hover:bg-red-700"
                disabled={loading || !canCheckOut || !phone}
              >
                <LogOut className="w-4 h-4 mr-2" />
                {loading ? 'Processing...' : 'Check Out'}
              </Button>
            </div>

            {/* Messages */}
            {message && (
              <div className="p-3 bg-green-100 text-green-800 rounded-md text-sm">
                {message}
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-100 text-red-800 rounded-md text-sm">
                {error}
              </div>
            )}

            {/* Info */}
            <div className="space-y-2 text-xs text-gray-600">
              <p className="text-center">
                Location access is required to verify you are within the office premises.
              </p>
              <div className="p-2 bg-gray-50 rounded text-center space-y-1">
                <p className="font-semibold">How it works:</p>
                <p>• <strong>Check In</strong> when you arrive at office</p>
                <p>• <strong>Check Out</strong> when you leave</p>
                <p>• System tracks your total working hours</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}