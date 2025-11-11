'use client';
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import { Label } from '../../../components/ui/label';
import { 
  FileText, 
  Calendar, 
  Phone,
  Search,
  Download,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';

export default function AttendanceReport() {
  const [phone, setPhone] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState(null);
  const [error, setError] = useState('');

  const fetchReport = async () => {
    setError('');
    setReportData(null);

    if (!phone || phone.length < 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    if (!startDate || !endDate) {
      setError('Please select both start and end dates');
      return;
    }

    try {
      const response = await fetch(
        `/api/attendance/report?phone=${phone}&startDate=${startDate}&endDate=${endDate}`
      );
      
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.error || 'Failed to fetch report');
        return;
      }

      setReportData(data);
    } catch (err) {
      setError('Failed to fetch report: ' + err.message);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 print:mb-4">
          <h1 className="text-4xl font-bold text-black mb-2 flex items-center justify-center gap-3">
            <FileText className="w-8 h-8" />
            Attendance Report
          </h1>
          <p className="text-gray-600">Generate detailed attendance reports</p>
        </div>

        {/* Filter Section - Hidden in print */}
        <Card className="mb-8 print:hidden border-2 border-black">
          <CardHeader className="bg-black text-white">
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Search Criteria
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <Label htmlFor="phone" className="flex items-center gap-2 mb-2">
                  <Phone className="w-4 h-4" />
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="10-digit phone"
                  maxLength={10}
                  className="border-2 border-gray-300"
                />
              </div>

              <div>
                <Label htmlFor="startDate" className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4" />
                  Start Date
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="border-2 border-gray-300"
                />
              </div>

              <div>
                <Label htmlFor="endDate" className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4" />
                  End Date
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="border-2 border-gray-300"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                onClick={fetchReport}
                className="flex-1 bg-black hover:bg-gray-800 text-white"
              >
                <Search className="w-4 h-4 mr-2" />
                Generate Report
              </Button>
              
              {reportData && (
                <Button 
                  onClick={handlePrint}
                  variant="outline"
                  className="border-2 border-black hover:bg-gray-100"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Print / Save PDF
                </Button>
              )}
            </div>

            {error && (
              <div className="mt-4 p-3 bg-gray-100 text-black rounded border-2 border-black">
                {error}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Report Section */}
        {reportData && (
          <div className="space-y-6">
            {/* Report Header - Visible in print */}
            <div className="hidden print:block text-center mb-6 pb-4 border-b-2 border-black">
              <h2 className="text-2xl font-bold">ATTENDANCE REPORT</h2>
              <p className="text-sm mt-2">
                Period: {formatDate(reportData?.summary?.dateRange?.start || reportData?.dateRange?.start || reportData?.filters?.startDate || startDate)} to {formatDate(reportData?.summary?.dateRange?.end || reportData?.dateRange?.end || reportData?.filters?.endDate || endDate)}
              </p>
              <p className="text-sm">Generated: {new Date().toLocaleString()}</p>
            </div>

            {/* Employee Info */}
            {reportData.data.length > 0 && (
              <Card className="border-2 border-black">
                <CardHeader className="bg-black text-white">
                  <CardTitle>Employee Information</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Name</p>
                      <p className="font-semibold text-lg">{reportData.data[0].employee.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="font-semibold text-lg">{reportData.data[0].employee.phone}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-semibold text-lg">{reportData.data[0].employee.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Department</p>
                      <p className="font-semibold text-lg">{reportData.data[0].employee.department}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Statistics */}
            <Card className="border-2 border-black">
              <CardHeader className="bg-black text-white">
                <CardTitle>Summary Statistics</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="text-center p-4 border-2 border-black">
                    <p className="text-3xl font-bold">{reportData.stats.totalDays}</p>
                    <p className="text-sm text-gray-600">Total Days</p>
                  </div>
                  <div className="text-center p-4 border-2 border-black">
                    <p className="text-3xl font-bold">{reportData.stats.presentDays}</p>
                    <p className="text-sm text-gray-600">Present</p>
                  </div>
                  <div className="text-center p-4 border-2 border-black">
                    <p className="text-3xl font-bold">{reportData.stats.halfDays}</p>
                    <p className="text-sm text-gray-600">Half Days</p>
                  </div>
                  <div className="text-center p-4 border-2 border-black">
                    <p className="text-3xl font-bold">{reportData.stats.totalHours.toFixed(2)}</p>
                    <p className="text-sm text-gray-600">Total Hours</p>
                  </div>
                  <div className="text-center p-4 border-2 border-black">
                    <p className="text-3xl font-bold">{reportData.stats.averageHours.toFixed(2)}</p>
                    <p className="text-sm text-gray-600">Avg Hours/Day</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Attendance Table */}
            <Card className="border-2 border-black">
              <CardHeader className="bg-black text-white">
                <CardTitle>Attendance Records</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-200 border-b-2 border-black">
                        <th className="p-3 text-left border-r border-black">Date</th>
                        <th className="p-3 text-left border-r border-black">Check In</th>
                        <th className="p-3 text-left border-r border-black">Check Out</th>
                        <th className="p-3 text-left border-r border-black">Hours</th>
                        <th className="p-3 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.data.map((record, index) => (
                        <tr 
                          key={record._id} 
                          className={`border-b border-gray-300 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                        >
                          <td className="p-3 border-r border-gray-300">
                            {formatDate(record.date)}
                          </td>
                          <td className="p-3 border-r border-gray-300">
                            {record.checkIn ? (
                              <span className="flex items-center gap-1">
                                <CheckCircle className="w-4 h-4 text-black" />
                                {record.checkIn.time}
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-gray-400">
                                <XCircle className="w-4 h-4" />
                                Not checked in
                              </span>
                            )}
                          </td>
                          <td className="p-3 border-r border-gray-300">
                            {record.checkOut ? (
                              <span className="flex items-center gap-1">
                                <CheckCircle className="w-4 h-4 text-black" />
                                {record.checkOut.time}
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-gray-400">
                                <XCircle className="w-4 h-4" />
                                Not checked out
                              </span>
                            )}
                          </td>
                          <td className="p-3 border-r border-gray-300 font-semibold">
                            {record.totalHours > 0 ? (
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {record.totalHours}h
                              </span>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td className="p-3">
                            <span className={`px-3 py-1 text-xs font-semibold border-2 ${
                              record.status === 'present' 
                                ? 'border-black bg-white' 
                                : record.status === 'half-day'
                                ? 'border-gray-600 bg-gray-100'
                                : 'border-gray-400 bg-gray-50'
                            }`}>
                              {record.status.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {reportData && reportData.data.length === 0 && (
          <Card className="border-2 border-black">
            <CardContent className="p-12 text-center">
              <p className="text-xl text-gray-600">No attendance records found for the selected period.</p>
            </CardContent>
          </Card>
        )}

        {/* Print Styles */}
        <style jsx global>{`
          @media print {
            body {
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
            }
            .print\\:hidden {
              display: none !important;
            }
            .print\\:block {
              display: block !important;
            }
            @page {
              margin: 1cm;
            }
          }
        `}</style>
      </div>
    </div>
  );
}