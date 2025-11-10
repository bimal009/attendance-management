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
    
    console.log('Report API called with:', { startDate, endDate, department });
    
    // Build query for employees
    let employeeQuery = { isActive: true };
    
    if (department && department !== 'all') {
      employeeQuery.department = department;
    }
    
    // Get all active employees (with or without department filter)
    const employees = await Employee.find(employeeQuery).sort({ name: 1 });
    console.log(`Found ${employees.length} employees`);
    
    // Build date range for attendance query
    let dateRange = {};
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // End of the day
      
      dateRange = {
        $gte: start,
        $lte: end
      };
    } else {
      // Default to last 30 days if no date range provided
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 30);
      
      dateRange = {
        $gte: start,
        $lte: end
      };
    }
    
    // Get attendance records for the date range and employees
    const attendanceRecords = await Attendance.find({
      date: dateRange,
      employeeId: { $in: employees.map(emp => emp._id) }
    })
    .populate('employeeId')
    .sort({ date: 1 }); // Sort by date ascending for proper ordering
    
    console.log(`Found ${attendanceRecords.length} attendance records`);
    
    // Create a map of dates to build the report
    const dateMap = new Map();
    const employeeMap = new Map();
    
    // Initialize employee data structure
    employees.forEach(emp => {
      employeeMap.set(emp._id.toString(), {
        employee: {
          _id: emp._id,
          name: emp.name,
          phone: emp.phone,
          department: emp.department,
          position: emp.position
        },
        attendance: new Map(), // dateStr -> attendance data
        summary: {
          totalDays: 0,
          presentDays: 0,
          absentDays: 0,
          totalHours: 0
        }
      });
    });
    
    // Process attendance records and populate date map
    attendanceRecords.forEach(record => {
      const empId = record.employeeId._id.toString();
      const dateStr = record.date.toISOString().split('T')[0];
      
      // Add date to dateMap
      if (!dateMap.has(dateStr)) {
        dateMap.set(dateStr, record.date);
      }
      
      // Add attendance record to employee
      if (employeeMap.has(empId)) {
        const attendanceData = {
          checkIn: record.checkIn?.time || '-',
          checkOut: record.checkOut?.time || '-',
          totalHours: record.totalHours || 0,
          status: record.checkIn ? 'present' : 'absent',
          location: record.checkIn?.location || record.checkOut?.location || null
        };
        
        employeeMap.get(empId).attendance.set(dateStr, attendanceData);
        
        // Update summary
        const employeeData = employeeMap.get(empId);
        employeeData.summary.totalDays++;
        if (record.checkIn) {
          employeeData.summary.presentDays++;
          employeeData.summary.totalHours += (record.totalHours || 0);
        } else {
          employeeData.summary.absentDays++;
        }
      }
    });
    
    // Convert dates to array and sort
    const dates = Array.from(dateMap.entries())
      .map(([dateStr, date]) => ({ dateStr, date }))
      .sort((a, b) => new Date(a.dateStr) - new Date(b.dateStr)); // Oldest to newest
    
    // Convert employeeMap to array
    const reportData = Array.from(employeeMap.values());
    
    // Calculate overall summary
    const overallSummary = {
      totalEmployees: employees.length,
      totalRecords: attendanceRecords.length,
      dateRange: {
        start: dates.length > 0 ? dates[0].dateStr : null,
        end: dates.length > 0 ? dates[dates.length - 1].dateStr : null
      },
      totalDays: dates.length
    };
    
    const response = {
      success: true,
      employees: reportData,
      dates: dates,
      summary: overallSummary,
      filters: {
        startDate,
        endDate,
        department
      }
    };
    
    console.log('Report generated:', {
      employees: reportData.length,
      dates: dates.length,
      totalRecords: attendanceRecords.length
    });
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Error in report API:', error);
    return NextResponse.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
}