'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    absentToday: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [employeesRes, attendanceRes] = await Promise.all([
        fetch('/api/employees'),
        fetch('/api/attendance')
      ]);

      const employees = await employeesRes.json();
      const attendance = await attendanceRes.json();

      const today = new Date().toDateString();
      const todayAttendance = attendance.filter(record => 
        new Date(record.date).toDateString() === today
      );

      setStats({
        totalEmployees: employees.length,
        presentToday: todayAttendance.length,
        absentToday: employees.length - todayAttendance.length
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Total Employees</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.totalEmployees}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Present Today</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">{stats.presentToday}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Absent Today</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-red-600">{stats.absentToday}</p>
            </CardContent>
          </Card>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>Employee Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">Add, edit, and manage employees</p>
              <Link href="/dashboard/employees">
                <Button>Manage Employees</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>Attendance Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">View attendance records and reports</p>
              <Link href="/dashboard/attendance">
                <Button>View Attendance</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>QR Code Generator</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">Generate QR code for attendance</p>
              <Link href="/dashboard/qr-code">
                <Button>Generate QR</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}