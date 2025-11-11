// app/api/attendance/checkin/route.js
import { NextResponse } from 'next/server';
import dbConnect from '../../../../lib/mongoose';
import Attendance from '../../../../models/Attendance';
import Employee from '../../../../models/Employee';
import { calculateDistance, OFFICE_LOCATION } from '../../../../lib/utils';

// Utility: Get current time in Nepal timezone
function getCurrentTime() {
  // Get current UTC time
  const now = new Date();
  
  // Nepal is UTC+5:45
  const nepaliTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kathmandu' }));
  
  // Get start of day in Nepal time
  const startOfDay = new Date(nepaliTime);
  startOfDay.setHours(0, 0, 0, 0);
  
  return {
    time: nepaliTime.toLocaleTimeString('en-US', { 
      hour12: true, 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    }),
    timestamp: nepaliTime.toISOString(),
    date: startOfDay,
    full: nepaliTime
  };
}

export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { phone, lat, lng } = body;

    console.log('=== CHECK-IN REQUEST START ===');
    console.log('Phone:', phone);
    console.log('Location:', { lat, lng });

    // Find employee
    const employee = await Employee.findOne({ phone });
    if (!employee) {
      console.log('ERROR: Employee not found');
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    console.log('Employee found:', { id: employee._id, name: employee.name });

    // Calculate distance from office
    const distance = calculateDistance(lat, lng, OFFICE_LOCATION.lat, OFFICE_LOCATION.lng);
    const withinRange = distance <= 100;

    console.log('Distance check:', { distance: Math.round(distance), withinRange });

    if (!withinRange) {
      return NextResponse.json({ 
        error: 'You are outside the office range', 
        distance: Math.round(distance) 
      }, { status: 400 });
    }

    const { date: today, time: currentTime, timestamp: currentTimestamp } = getCurrentTime();

    console.log('Current Nepal time:', { 
      date: today, 
      time: currentTime, 
      timestamp: currentTimestamp 
    });

    // Check if already checked in today (only check today's records)
    const existingAttendance = await Attendance.findOne({
      employeeId: employee._id,
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      },
      checkIn: { $exists: true, $ne: null }
    });

    console.log('Existing check-in today:', {
      found: !!existingAttendance,
      checkInTime: existingAttendance?.checkIn?.time
    });

    if (existingAttendance) {
      console.log('ERROR: Already checked in today');
      return NextResponse.json({ 
        error: 'Already checked in today. Only one check-in allowed per day.', 
        attendance: existingAttendance 
      }, { status: 400 });
    }

    const locationData = {
      lat,
      lng,
      distanceFromOffice: Math.round(distance),
      withinRange
    };

    // Create new attendance record
    const attendance = await Attendance.create({
      employeeId: employee._id,
      date: today,
      checkIn: {
        time: currentTime,
        timestamp: currentTimestamp,
        location: locationData
      },
      status: 'present'
    });

    await attendance.populate('employeeId');
    
    console.log('✓ Check-in successful:', {
      id: attendance._id,
      time: attendance.checkIn.time
    });
    console.log('=== CHECK-IN REQUEST END ===\n');
    
    return NextResponse.json({ 
      message: 'Checked in successfully',
      attendance 
    }, { status: 201 });

  } catch (error) {
    console.error('=== CHECK-IN ERROR ===');
    console.error('Error:', error);
    console.error('Stack:', error.stack);
    console.error('=== ERROR END ===\n');
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}