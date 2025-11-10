'use client';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import React, { useState, useEffect } from 'react';

export default function AttendancePage() {
  const [attendance, setAttendance] = useState([]);

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    try {
      const response = await fetch('/api/attendance');
      const data = await response.json();
      setAttendance(data);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Attendance Overview</h1>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Recent Attendance Records</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Distance</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendance.map((record) => (
                  <TableRow key={record._id}>
                    <TableCell>{record.employeeId?.name}</TableCell>
                    <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                    <TableCell>{record.time}</TableCell>
                    <TableCell>
                      {record.location?.lat ? `${record.location.lat.toFixed(4)}, ${record.location.lng.toFixed(4)}` : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {record.location?.distanceFromOffice ? `${record.location.distanceFromOffice}m` : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        record.location?.withinRange 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {record.location?.withinRange ? 'Within Range' : 'Out of Range'}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}