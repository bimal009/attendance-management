// app/attendance/page.js
'use client';
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { LogIn, LogOut, Clock, Calendar, Users, Filter } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';

export default function AttendancePage() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [activeTab, setActiveTab] = useState('mark'); // 'mark' or 'view'
  const [attendanceData, setAttendanceData] = useState({ employees: [], dates: [] });
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [loadingReport, setLoadingReport] = useState(false);

  // Check today's attendance status
  const checkTodayStatus = async () => {
    if (!phone) return;
    
    setCheckingStatus(true);
    try {
      const response = await fetch(`/api/attendance?date=${new Date().toISOString().split('T')[0]}`);
      const allAttendance = await response.json();
      
      // Find today's attendance for this phone
      const todayRecord = allAttendance.find(record => 
        record.employeeId?.phone === phone
      );
      
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

  // Load attendance report
  const loadAttendanceReport = async () => {
    setLoadingReport(true);
    try {
      const response = await fetch(`/api/attendance/report?startDate=${filterDate}&endDate=${filterDate}`);
      const data = await response.json();
      setAttendanceData(data);
    } catch (error) {
      console.error('Error loading report:', error);
    } finally {
      setLoadingReport(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'view') {
      loadAttendanceReport();
    }
  }, [activeTab, filterDate]);

  const handleAttendance = async (action) => {
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });

      const { latitude, longitude } = position.coords;

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
        // Refresh report if on view tab
        if (activeTab === 'view') {
          loadAttendanceReport();
        }
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
  const canCheckOut = todayAttendance && !todayAttendance.checkOut;

  // Calculate statistics
  const presentCount = attendanceData.employees.filter(emp => 
    Array.from(emp.attendance.values()).some(att => att.status === 'present')
  ).length;

  const absentCount = attendanceData.employees.length - presentCount;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-3">
            <Clock className="w-8 h-8" />
            Attendance System
          </h1>
          <p className="text-gray-600">Manage employee attendance with real-time tracking</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 bg-white rounded-lg p-1 shadow-sm w-fit mx-auto">
          <Button
            variant={activeTab === 'mark' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('mark')}
            className={`px-6 ${activeTab === 'mark' ? 'bg-blue-600 text-white' : ''}`}
          >
            <LogIn className="w-4 h-4 mr-2" />
            Mark Attendance
          </Button>
          <Button
            variant={activeTab === 'view' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('view')}
            className={`px-6 ${activeTab === 'view' ? 'bg-green-600 text-white' : ''}`}
          >
            <Users className="w-4 h-4 mr-2" />
            View Records
          </Button>
        </div>

        {/* Mark Attendance Tab */}
        {activeTab === 'mark' && (
          <Card className="w-full max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="text-center">Mark Your Attendance</CardTitle>
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
                        <span>Check In: {todayAttendance.checkIn?.time || 'Not checked in'}</span>
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
              </div>
            </CardContent>
          </Card>
        )}

        {/* View Records Tab */}
        {activeTab === 'view' && (
          <div className="space-y-6">
            {/* Filters and Stats */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-600" />
                      <Label htmlFor="date">Select Date</Label>
                    </div>
                    <Input
                      id="date"
                      type="date"
                      value={filterDate}
                      onChange={(e) => setFilterDate(e.target.value)}
                      className="w-40"
                    />
                    <Button onClick={loadAttendanceReport} disabled={loadingReport}>
                      <Filter className="w-4 h-4 mr-2" />
                      {loadingReport ? 'Loading...' : 'Filter'}
                    </Button>
                  </div>
                  
                  <div className="flex gap-4 text-sm">
                    <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full">
                      <Users className="w-4 h-4 inline mr-1" />
                      Present: {presentCount}
                    </div>
                    <div className="bg-red-100 text-red-800 px-3 py-1 rounded-full">
                      <Users className="w-4 h-4 inline mr-1" />
                      Absent: {absentCount}
                    </div>
                    <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                      <Users className="w-4 h-4 inline mr-1" />
                      Total: {attendanceData.employees.length}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Attendance Table */}
            <Card>
              <CardHeader>
                <CardTitle>Attendance Records - {new Date(filterDate).toLocaleDateString()}</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingReport ? (
                  <div className="text-center py-8">Loading attendance data...</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-200">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border border-gray-200 px-4 py-3 text-left font-semibold">Employee</th>
                          <th className="border border-gray-200 px-4 py-3 text-left font-semibold">Department</th>
                          <th className="border border-gray-200 px-4 py-3 text-left font-semibold">Role</th>
                          <th className="border border-gray-200 px-4 py-3 text-left font-semibold">Check In</th>
                          <th className="border border-gray-200 px-4 py-3 text-left font-semibold">Check Out</th>
                          <th className="border border-gray-200 px-4 py-3 text-left font-semibold">Total Hours</th>
                          <th className="border border-gray-200 px-4 py-3 text-left font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attendanceData.employees.map((item, index) => {
                          const attendance = item.attendance.get(filterDate) || {
                            checkIn: '-',
                            checkOut: '-',
                            totalHours: 0,
                            status: 'absent'
                          };
                          
                          return (
                            <tr key={item.employee._id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <td className="border border-gray-200 px-4 py-3">
                                <div>
                                  <div className="font-medium">{item.employee.name}</div>
                                  <div className="text-sm text-gray-600">{item.employee.phone}</div>
                                </div>
                              </td>
                              <td className="border border-gray-200 px-4 py-3">{item.employee.department}</td>
                              <td className="border border-gray-200 px-4 py-3">{item.employee.role}</td>
                              <td className="border border-gray-200 px-4 py-3">{attendance.checkIn}</td>
                              <td className="border border-gray-200 px-4 py-3">{attendance.checkOut}</td>
                              <td className="border border-gray-200 px-4 py-3">
                                {attendance.totalHours > 0 ? `${attendance.totalHours}h` : '-'}
                              </td>
                              <td className="border border-gray-200 px-4 py-3">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  attendance.status === 'present' 
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {attendance.status === 'present' ? 'Present' : 'Absent'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    
                    {attendanceData.employees.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        No attendance records found for the selected date.
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}