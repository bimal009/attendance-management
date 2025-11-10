'use client';
import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../../components/ui/table';

export default function EmployeeDetailsPage() {
  const params = useParams();
  const [employee, setEmployee] = useState(null);
  const [attendance, setAttendance] = useState([]);

  useEffect(() => {
    if (params.id) {
      fetchEmployeeDetails();
      fetchEmployeeAttendance();
    }
  }, [params.id]);

  const fetchEmployeeDetails = async () => {
    try {
      const response = await fetch('/api/employees');
      const employees = await response.json();
      const currentEmployee = employees.find(emp => emp._id === params.id);
      setEmployee(currentEmployee);
    } catch (error) {
      console.error('Error fetching employee:', error);
    }
  };

  const fetchEmployeeAttendance = async () => {
    try {
      const response = await fetch('/api/attendance');
      const allAttendance = await response.json();
      const employeeAttendance = allAttendance.filter(record => 
        record.employeeId?._id === params.id
      );
      setAttendance(employeeAttendance);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  };

  if (!employee) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Employee Details</h1>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Employee Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-semibold">Name:</label>
                <p>{employee.name}</p>
              </div>
              <div>
                <label className="font-semibold">Phone:</label>
                <p>{employee.phone}</p>
              </div>
              <div>
                <label className="font-semibold">Email:</label>
                <p>{employee.email}</p>
              </div>
              <div>
                <label className="font-semibold">Department:</label>
                <p>{employee.department}</p>
              </div>
              <div>
                <label className="font-semibold">Role:</label>
                <p>{employee.role}</p>
              </div>
              <div>
                <label className="font-semibold">Joined:</label>
                <p>{new Date(employee.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Attendance History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
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