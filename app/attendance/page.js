'use client';
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { 
  LogIn, 
  LogOut, 
  Clock, 
  Calendar, 
  Phone,
  RefreshCw,
  MapPin,
  AlertCircle
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
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [checkingStatus, setCheckingStatus] = useState(false);

  const checkTodayStatus = async (forceRefresh = false) => {
    if (!phone || phone.length < 10) {
      setTodayAttendance(null);
      return;
    }
    
    setCheckingStatus(true);
    setError('');
    
    try {
      const today = new Date().toISOString().split('T')[0];
      const timestamp = forceRefresh ? `&t=${Date.now()}` : '';
      const response = await fetch(`/api/attendance?date=${today}&phone=${phone}${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch attendance data');
      }
      
      const attendanceData = await response.json();
      
      console.log('📊 Fetched attendance data:', attendanceData);
      
      const todayRecord = Array.isArray(attendanceData) && attendanceData.length > 0 
        ? attendanceData[0] 
        : null;
      
      console.log('📅 Today record:', {
        found: !!todayRecord,
        hasCheckIn: !!todayRecord?.checkIn,
        hasCheckOut: !!todayRecord?.checkOut,
        checkInTime: todayRecord?.checkIn?.time,
        checkOutTime: todayRecord?.checkOut?.time
      });
      
      setTodayAttendance(todayRecord);
    } catch (error) {
      console.error('❌ Error checking status:', error);
      setTodayAttendance(null);
    } finally {
      setCheckingStatus(false);
    }
  };

  useEffect(() => {
    if (phone.length >= 10) {
      const debounceTimer = setTimeout(() => {
        checkTodayStatus();
      }, 500);
      
      return () => clearTimeout(debounceTimer);
    } else {
      setTodayAttendance(null);
    }
  }, [phone]);

  const handleAttendance = async (action) => {
    console.log(`\n🚀 Starting ${action} process...`);
    setLoading(true);
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

      console.log(`📤 Sending ${action} request to API...`);
      
      // Make API call
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
      console.log('📥 API Response:', {
        status: response.status,
        ok: response.ok,
        data
      });

      if (response.ok) {
        const employeeName = data.attendance?.employeeId?.name || 'Employee';
        
        if (action === 'check-in') {
          setMessage(`✓ Checked in successfully, ${employeeName}!`);
        } else {
          setMessage(`✓ Checked out successfully, ${employeeName}! Total hours: ${data.totalHours}h`);
        }
        
        console.log('✓ Success! Updating local state...');
        
        // CRITICAL: Clear the old state first to force a fresh render
        setTodayAttendance(null);
        
        // Wait a bit before setting new state
        setTimeout(() => {
          setTodayAttendance(data.attendance);
          console.log('✓ Local state updated:', {
            hasCheckIn: !!data.attendance?.checkIn,
            hasCheckOut: !!data.attendance?.checkOut
          });
        }, 100);
        
        // Force refresh from server after a short delay
        setTimeout(() => {
          console.log('🔄 Force refreshing from server...');
          checkTodayStatus(true);
        }, 1000);
        
        // Clear message after 5 seconds
        setTimeout(() => setMessage(''), 5000);
      } else {
        console.error('❌ Request failed:', data.error);
        setError(data.error || `Failed to ${action}`);
        
        // Still refresh to sync state
        setTimeout(() => {
          checkTodayStatus(true);
        }, 500);
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
      
      setTimeout(() => {
        checkTodayStatus(true);
      }, 500);
    } finally {
      setLoading(false);
      console.log(`✓ ${action} process completed\n`);
    }
  };

  const hasCheckedIn = todayAttendance?.checkIn !== null && todayAttendance?.checkIn !== undefined;
  const hasCheckedOut = todayAttendance?.checkOut !== null && todayAttendance?.checkOut !== undefined;
  
  console.log('🔘 Button state:', { 
    hasCheckedIn, 
    hasCheckedOut,
    checkInExists: hasCheckedIn ? 'YES' : 'NO',
    checkOutExists: hasCheckedOut ? 'YES' : 'NO',
    todayAttendance: todayAttendance ? 'EXISTS' : 'NULL'
  });
  
  const canCheckIn = !hasCheckedIn;
  const canCheckOut = hasCheckedIn && !hasCheckedOut;

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
                  disabled={loading}
                  className="w-full"
                  maxLength={10}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter your 10-digit phone number
                </p>
              </div>

              {checkingStatus && (
                <div className="p-3 bg-gray-100 rounded-md text-sm text-center flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Checking today's status...
                </div>
              )}

              {todayAttendance && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-md space-y-2">
                  <h3 className="font-semibold text-blue-900 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Today's Status
                  </h3>
                  <div className="text-sm space-y-2">
                    {hasCheckedIn ? (
                      <p className="flex items-center gap-2">
                        <LogIn className="w-4 h-4 text-green-600" />
                        <span>
                          <strong>Check In:</strong> {todayAttendance.checkIn?.time || 'Unknown time'}
                        </span>
                      </p>
                    ) : (
                      <p className="text-gray-600">Not checked in yet</p>
                    )}
                    
                    {hasCheckedOut ? (
                      <>
                        <p className="flex items-center gap-2">
                          <LogOut className="w-4 h-4 text-red-600" />
                          <span>
                            <strong>Check Out:</strong> {todayAttendance.checkOut?.time}
                          </span>
                        </p>
                        <p className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-blue-600" />
                          <span className="font-semibold">
                            Total Hours: {todayAttendance.totalHours}h
                          </span>
                        </p>
                      </>
                    ) : hasCheckedIn && (
                      <p className="text-green-600 text-sm flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        ✓ Checked in. You can check out when leaving.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {phone.length >= 10 && !checkingStatus && todayAttendance && (
                <div className="text-xs bg-yellow-50 border border-yellow-200 p-3 rounded flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-yellow-800">
                    <strong>Debug Info:</strong><br />
                    CheckIn: {hasCheckedIn ? '✓ YES' : '✗ NO'} | 
                    CheckOut: {hasCheckedOut ? '✓ YES' : '✗ NO'}<br />
                    Record ID: {todayAttendance._id || 'N/A'}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <Button 
                  onClick={() => handleAttendance('check-in')}
                  className="w-full bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading || !phone || phone.length < 10 || !canCheckIn}
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <LogIn className="w-4 h-4 mr-2" />
                  )}
                  {loading ? 'Processing...' : 'Check In'}
                </Button>

                <Button 
                  onClick={() => handleAttendance('check-out')}
                  className="w-full bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading || !phone || phone.length < 10 || !canCheckOut}
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <LogOut className="w-4 h-4 mr-2" />
                  )}
                  {loading ? 'Processing...' : 'Check Out'}
                </Button>
              </div>

              {phone.length >= 10 && !checkingStatus && (
                <div className="text-xs text-center text-gray-600 bg-gray-50 p-2 rounded">
                  {hasCheckedOut ? (
                    <span className="text-purple-600">✓ You've completed attendance for today</span>
                  ) : hasCheckedIn ? (
                    <span className="text-green-600">✓ Checked in - You can now check out</span>
                  ) : (
                    <span className="text-blue-600">Ready to check in</span>
                  )}
                </div>
              )}

              {phone.length >= 10 && (
                <Button 
                  onClick={() => checkTodayStatus(true)}
                  variant="outline"
                  className="w-full"
                  disabled={checkingStatus}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${checkingStatus ? 'animate-spin' : ''}`} />
                  Refresh Status
                </Button>
              )}

              <div className="text-xs text-gray-500 space-y-1 p-3 bg-gray-50 rounded-md">
                <p className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  Ensure location services are enabled
                </p>
                <p>• You must be within 100m of office to mark attendance</p>
                <p>• Check in when arriving, check out when leaving</p>
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