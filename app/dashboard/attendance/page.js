'use client';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Badge } from '../../../components/ui/badge';
import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  User, 
  Calendar, 
  Clock, 
  MapPin, 
  CheckCircle, 
  XCircle,
  TrendingUp,
  LogIn, 
  LogOut,
  Phone
} from 'lucide-react';

// Nepali time utility functions
const toNepaliTime = (dateString, options = {}) => {
  if (!dateString) return 'N/A';
  
  try {
    // If it's already a Nepali formatted time from API, return as is
    if (typeof dateString === 'string' && dateString.includes('AM') || dateString.includes('PM')) {
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

// Main Attendance Overview Component
export default function AttendanceOverview() {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/attendance');
      if (!response.ok) {
        throw new Error('Failed to fetch attendance data');
      }
      const data = await response.json();
      setAttendance(data);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter attendance records
  const filteredAttendance = attendance.filter(record => {
    const matchesSearch = record.employeeId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.employeeId?.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.employeeId?.phone?.includes(searchTerm);
    
    const matchesDate = !dateFilter || 
                       (record.date && new Date(record.date).toISOString().split('T')[0] === dateFilter);
    
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'present' && record.checkIn) ||
                         (statusFilter === 'absent' && !record.checkIn) ||
                         (statusFilter === 'checked-out' && record.checkOut);
    
    const matchesDepartment = departmentFilter === 'all' || 
                             record.employeeId?.department === departmentFilter;
    
    return matchesSearch && matchesDate && matchesStatus && matchesDepartment;
  });

  // Calculate statistics
  const stats = {
    total: attendance.length,
    present: attendance.filter(record => record.checkIn).length,
    absent: attendance.filter(record => !record.checkIn).length,
    checkedOut: attendance.filter(record => record.checkOut).length,
    departments: [...new Set(attendance.map(record => record.employeeId?.department).filter(Boolean))],
    totalHours: attendance.reduce((sum, record) => sum + (record.totalHours || 0), 0)
  };

  const exportToCSV = () => {
    const headers = ['Employee Name', 'Phone', 'Department', 'Role', 'Date', 'Check In', 'Check Out', 'Total Hours', 'Status', 'Location', 'Distance'];
    const csvData = filteredAttendance.map(record => [
      record.employeeId?.name || 'N/A',
      record.employeeId?.phone || 'N/A',
      record.employeeId?.department || 'N/A',
      record.employeeId?.role || 'N/A',
      record.nepaliDate || toNepaliTime(record.date, { dateStyle: 'short' }),
      record.nepaliCheckIn || (record.checkIn?.timestamp ? toNepaliTime(record.checkIn.timestamp, { hour: '2-digit', minute: '2-digit', hour12: true }) : 'Not Checked In'),
      record.nepaliCheckOut || (record.checkOut?.timestamp ? toNepaliTime(record.checkOut.timestamp, { hour: '2-digit', minute: '2-digit', hour12: true }) : 'Not Checked Out'),
      record.totalHours || '0',
      record.checkIn ? (record.checkOut ? 'Checked Out' : 'Checked In') : 'Absent',
      record.checkIn?.location ? `${record.checkIn.location.lat?.toFixed(4) || '0'}, ${record.checkIn.location.lng?.toFixed(4) || '0'}` : 'N/A',
      record.checkIn?.location?.distanceFromOffice ? `${record.checkIn.location.distanceFromOffice}m` : 'N/A'
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(field => `"${field}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-600" />
          <p className="text-gray-600">Loading attendance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Attendance Overview</h1>
            <p className="text-gray-600 mt-2">Comprehensive view of all employee attendance records (Nepal Time)</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={fetchAttendance} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={exportToCSV} className="bg-green-600 hover:bg-green-700">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-white border-l-4 border-l-blue-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Records</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <User className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-l-4 border-l-green-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Present Today</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.present}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-l-4 border-l-red-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Absent Today</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.absent}</p>
                </div>
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-l-4 border-l-purple-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Hours</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalHours.toFixed(1)}h</p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="lg:col-span-2">
                <Label htmlFor="search" className="flex items-center gap-2 mb-2">
                  <Search className="w-4 h-4" />
                  Search
                </Label>
                <Input
                  id="search"
                  placeholder="Search by name, department, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="date" className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4" />
                  Date
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="status" className="flex items-center gap-2 mb-2">
                  <Filter className="w-4 h-4" />
                  Status
                </Label>
                <select
                  id="status"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="checked-out">Checked Out</option>
                </select>
              </div>

              <div>
                <Label htmlFor="department" className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4" />
                  Department
                </Label>
                <select
                  id="department"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                >
                  <option value="all">All Departments</option>
                  {stats.departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Attendance Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Attendance Records</CardTitle>
            <div className="text-sm text-gray-600">
              Showing {filteredAttendance.length} of {attendance.length} records
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold">Employee</TableHead>
                    <TableHead className="font-semibold">Department</TableHead>
                    <TableHead className="font-semibold">Date</TableHead>
                    <TableHead className="font-semibold">Check In</TableHead>
                    <TableHead className="font-semibold">Check Out</TableHead>
                    <TableHead className="font-semibold">Total Hours</TableHead>
                    <TableHead className="font-semibold">Location</TableHead>
                    <TableHead className="font-semibold">Distance</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAttendance.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                        No attendance records found matching your filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAttendance.map((record) => (
                      <TableRow key={record._id} className="hover:bg-gray-50">
                        <TableCell>
                          <div>
                            <div className="font-medium text-gray-900">
                              {record.employeeId?.name || 'Unknown Employee'}
                            </div>
                            <div className="text-sm text-gray-600 flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {record.employeeId?.phone || 'N/A'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {record.employeeId?.role || 'N/A'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700">
                            {record.employeeId?.department || 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            {record.nepaliDate || toNepaliTime(record.date, { dateStyle: 'medium' })}
                          </div>
                        </TableCell>
                        <TableCell>
                          {record.checkIn ? (
                            <div className="flex items-center gap-2 text-green-600">
                              <Clock className="w-4 h-4" />
                              {record.nepaliCheckIn || record.checkIn.time || toNepaliTime(record.checkIn.timestamp, { 
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: true
                              })}
                            </div>
                          ) : (
                            <span className="text-red-500 text-sm">Not Checked In</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {record.checkOut ? (
                            <div className="flex items-center gap-2 text-red-600">
                              <Clock className="w-4 h-4" />
                              {record.nepaliCheckOut || record.checkOut.time || toNepaliTime(record.checkOut.timestamp, { 
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: true
                              })}
                            </div>
                          ) : (
                            <span className="text-gray-500 text-sm">Not Checked Out</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {record.totalHours ? (
                            <div className="font-medium text-blue-600">
                              {record.totalHours}h
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {record.checkIn?.location ? (
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-gray-400" />
                              <div className="text-xs">
                                {record.checkIn.location.lat?.toFixed(4) || '0.0000'},<br />
                                {record.checkIn.location.lng?.toFixed(4) || '0.0000'}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">N/A</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {record.checkIn?.location?.distanceFromOffice ? (
                            <div className={`font-medium ${
                              record.checkIn.location.withinRange 
                                ? 'text-green-600' 
                                : 'text-red-600'
                            }`}>
                              {record.checkIn.location.distanceFromOffice}m
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {!record.checkIn ? (
                            <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
                              Absent
                            </Badge>
                          ) : record.checkOut ? (
                            <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">
                              Checked Out
                            </Badge>
                          ) : (
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                              Checked In
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Additional Info */}
        <div className="text-center text-sm text-gray-500">
          <p>Data last updated: {toNepaliTime(new Date().toISOString(), { 
            dateStyle: 'medium', 
            timeStyle: 'medium' 
          })}</p>
          <p className="mt-1">Total records in database: {attendance.length}</p>
        </div>
      </div>
    </div>
  );
}