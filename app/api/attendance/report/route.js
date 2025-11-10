// app/api/attendance/report/route.js
import { NextResponse } from 'next/server';
import dbConnect from '../../../../lib/mongoose';
import Attendance from '../../../../models/Attendance';
import Employee from '../../../../models/Employee';

export async function GET(request) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const department = searchParams.get('department');
    
    // Build query for attendance records
    let attendanceQuery = {};
    let employeeQuery = { isActive: true };
    
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setDate(end.getDate() + 1); // Include end date
      
      attendanceQuery.date = {
        $gte: start,
        $lt: end
      };
    }
    
    if (department) {
      employeeQuery.department = department;
    }
    
    // Get all active employees
    const employees = await Employee.find(employeeQuery).sort({ name: 1 });
    
    // Get attendance records for the date range
    const attendanceRecords = await Attendance.find(attendanceQuery)
      .populate('employeeId')
      .sort({ date: -1 });
    
    // Create a map of dates to build the report
    const dateMap = new Map();
    const employeeMap = new Map();
    
    // Initialize employee data
    employees.forEach(emp => {
      employeeMap.set(emp._id.toString(), {
        employee: emp,
        attendance: new Map()
      });
    });
    
    // Process attendance records
    attendanceRecords.forEach(record => {
      const empId = record.employeeId._id.toString();
      const dateStr = record.date.toISOString().split('T')[0];
      
      if (employeeMap.has(empId)) {
        employeeMap.get(empId).attendance.set(dateStr, {
          checkIn: record.checkIn?.time || '-',
          checkOut: record.checkOut?.time || '-',
          totalHours: record.totalHours || 0,
          status: record.checkIn ? 'present' : 'absent'
        });
      }
    });
    
    // Get unique dates from attendance records
    attendanceRecords.forEach(record => {
      const dateStr = record.date.toISOString().split('T')[0];
      if (!dateMap.has(dateStr)) {
        dateMap.set(dateStr, record.date);
      }
    });
    
    // Convert to arrays for response
    const dates = Array.from(dateMap.entries())
      .sort(([a], [b]) => new Date(b) - new Date(a))
      .slice(0, 30); // Last 30 days
    
    const report = Array.from(employeeMap.values());
    
    return NextResponse.json({
      employees: report,
      dates: dates.map(([dateStr, date]) => ({ dateStr, date })),
      totalEmployees: employees.length
    });
    
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}