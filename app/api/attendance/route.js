// app/api/attendance/route.js
import { NextResponse } from 'next/server';
import dbConnect from '../../../lib/mongoose';
import Attendance from '../../../models/Attendance';
import Employee from '../../../models/Employee';
import { calculateDistance, OFFICE_LOCATION } from '../../../lib/utils';

// Utility: Get current time in Nepal timezone
function getCurrentTime() {
  const now = new Date();
  // Convert to Nepali time (UTC + 5 hours 45 minutes)
  const nepaliTime = new Date(now.getTime() + (5 * 60 + 45) * 60000);
  
  return {
    time: nepaliTime.toLocaleTimeString('en-US', { 
      hour12: true, 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    }),
    date: new Date(nepaliTime.setHours(0, 0, 0, 0)), // Start of day in Nepal time
    full: nepaliTime
  };
}

// Calculate hours between two time strings
function calculateHours(checkInTime, checkOutTime) {
  const checkIn = new Date(`1970-01-01 ${checkInTime}`);
  const checkOut = new Date(`1970-01-01 ${checkOutTime}`);
  
  // Handle AM/PM conversion properly
  let diffMs = checkOut - checkIn;
  
  // If check-out is earlier than check-in, assume it's the next day
  if (diffMs < 0) {
    diffMs += 24 * 60 * 60 * 1000; // Add 24 hours
  }
  
  const diffHours = diffMs / (1000 * 60 * 60);
  return Math.round(diffHours * 100) / 100;
}

export async function GET(request) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const employeeId = searchParams.get('employeeId');
    
    let query = {};
    
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
      
      query.date = {
        $gte: startDate,
        $lt: endDate
      };
    }
    
    if (employeeId) {
      query.employeeId = employeeId;
    }
    
    const attendance = await Attendance.find(query)
      .populate('employeeId')
      .sort({ date: -1, 'checkIn.time': -1 });
    
    return NextResponse.json(attendance);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { phone, lat, lng, action } = body;

    const employee = await Employee.findOne({ phone });
    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Calculate distance from office
    const distance = calculateDistance(lat, lng, OFFICE_LOCATION.lat, OFFICE_LOCATION.lng);
    const withinRange = distance <= 100; // 100 meters

    if (!withinRange) {
      return NextResponse.json({ 
        error: 'You are outside the office range', 
        distance: Math.round(distance) 
      }, { status: 400 });
    }

    const { date: today, time: currentTime } = getCurrentTime();

    // Find today's attendance record
    const existingAttendance = await Attendance.findOne({
      employeeId: employee._id,
      date: today
    });

    const locationData = {
      lat,
      lng,
      distanceFromOffice: Math.round(distance),
      withinRange
    };

    // Handle Check-In
    if (action === 'check-in') {
      if (existingAttendance) {
        return NextResponse.json({ 
          error: 'Already checked in today', 
          attendance: existingAttendance 
        }, { status: 400 });
      }

      // Create new attendance record
      const attendance = await Attendance.create({
        employeeId: employee._id,
        date: today,
        checkIn: {
          time: currentTime,
          location: locationData
        },
        status: 'present'
      });

      await attendance.populate('employeeId');
      return NextResponse.json({ 
        message: 'Checked in successfully',
        attendance 
      }, { status: 201 });
    }

    // Handle Check-Out
    if (action === 'check-out') {
      if (!existingAttendance) {
        return NextResponse.json({ 
          error: 'No check-in record found for today' 
        }, { status: 400 });
      }

      if (existingAttendance.checkOut) {
        return NextResponse.json({ 
          error: 'Already checked out today' 
        }, { status: 400 });
      }

      // Calculate total hours
      const totalHours = calculateHours(existingAttendance.checkIn.time, currentTime);

      // Update attendance with check-out
      existingAttendance.checkOut = {
        time: currentTime,
        location: locationData
      };
      existingAttendance.totalHours = totalHours;
      existingAttendance.workHours = totalHours;

      await existingAttendance.save();
      await existingAttendance.populate('employeeId');

      return NextResponse.json({ 
        message: 'Checked out successfully',
        attendance: existingAttendance,
        totalHours 
      }, { status: 200 });
    }

    return NextResponse.json({ 
      error: 'Invalid action. Use "check-in" or "check-out"' 
    }, { status: 400 });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}