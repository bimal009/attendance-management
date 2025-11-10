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
    timestamp: nepaliTime.toISOString(),
    date: new Date(nepaliTime.setHours(0, 0, 0, 0)), // Start of day in Nepal time
    full: nepaliTime
  };
}

// Calculate hours between two timestamps
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
    const phone = searchParams.get('phone');
    
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
    
    // If phone is provided, find employee first
    if (phone) {
      const employee = await Employee.findOne({ phone });
      if (employee) {
        query.employeeId = employee._id;
      } else {
        return NextResponse.json([]);
      }
    }
    
    const attendance = await Attendance.find(query)
      .populate('employeeId')
      .sort({ date: -1, 'checkIn.timestamp': -1 });
    
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

    console.log('=== ATTENDANCE REQUEST START ===');
    console.log('Action:', action);
    console.log('Phone:', phone);
    console.log('Location:', { lat, lng });

    const employee = await Employee.findOne({ phone });
    if (!employee) {
      console.log('ERROR: Employee not found');
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    console.log('Employee found:', { id: employee._id, name: employee.name });

    // Calculate distance from office
    const distance = calculateDistance(lat, lng, OFFICE_LOCATION.lat, OFFICE_LOCATION.lng);
    const withinRange = distance <= 100; // 100 meters

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

    // CRITICAL: Fresh query to get the latest state from database
    const existingAttendance = await Attendance.findOne({
      employeeId: employee._id,
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    });

    console.log('Existing attendance record:', {
      found: !!existingAttendance,
      hasCheckIn: !!existingAttendance?.checkIn,
      hasCheckOut: !!existingAttendance?.checkOut,
      checkInTime: existingAttendance?.checkIn?.time,
      checkOutTime: existingAttendance?.checkOut?.time
    });

    const locationData = {
      lat,
      lng,
      distanceFromOffice: Math.round(distance),
      withinRange
    };

    // Handle Check-In
    if (action === 'check-in') {
      if (existingAttendance && existingAttendance.checkIn) {
        console.log('ERROR: Already checked in');
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
      console.log('=== ATTENDANCE REQUEST END ===\n');
      
      return NextResponse.json({ 
        message: 'Checked in successfully',
        attendance 
      }, { status: 201 });
    }

    // Handle Check-Out
    if (action === 'check-out') {
      console.log('Processing checkout request...');
      
      // Validation 1: Check if attendance record exists
      if (!existingAttendance) {
        console.log('ERROR: No attendance record found for today');
        return NextResponse.json({ 
          error: 'No check-in record found for today. Please check in first.' 
        }, { status: 400 });
      }

      // Validation 2: Check if check-in exists
      if (!existingAttendance.checkIn) {
        console.log('ERROR: Check-in data missing in attendance record');
        return NextResponse.json({ 
          error: 'No check-in found for today. Please check in first.' 
        }, { status: 400 });
      }

      // Validation 3: Check if already checked out
      if (existingAttendance.checkOut) {
        console.log('ERROR: Already checked out', {
          checkOutTime: existingAttendance.checkOut.time
        });
        return NextResponse.json({ 
          error: 'Already checked out today',
          attendance: existingAttendance
        }, { status: 400 });
      }

      // All validations passed
      console.log('✓ All validations passed. Proceeding with checkout...');
      console.log('Check-in time:', existingAttendance.checkIn.time);
      console.log('Check-out time:', currentTime);

      // Calculate total hours
      const totalHours = calculateHours(existingAttendance.checkIn.time, currentTime);
      console.log('Total hours calculated:', totalHours);

      // Update attendance with check-out
      existingAttendance.checkOut = {
        time: currentTime,
        timestamp: currentTimestamp,
        location: locationData
      };
      existingAttendance.totalHours = totalHours;
      existingAttendance.workHours = totalHours;

      // Save the updated record
      const savedAttendance = await existingAttendance.save();
      await savedAttendance.populate('employeeId');

      console.log('✓ Check-out successful:', {
        id: savedAttendance._id,
        checkInTime: savedAttendance.checkIn.time,
        checkOutTime: savedAttendance.checkOut.time,
        totalHours: savedAttendance.totalHours
      });
      console.log('=== ATTENDANCE REQUEST END ===\n');

      return NextResponse.json({ 
        message: 'Checked out successfully',
        attendance: savedAttendance,
        totalHours 
      }, { status: 200 });
    }

    return NextResponse.json({ 
      error: 'Invalid action. Use "check-in" or "check-out"' 
    }, { status: 400 });

  } catch (error) {
    console.error('=== ATTENDANCE ERROR ===');
    console.error('Error:', error);
    console.error('Stack:', error.stack);
    console.error('=== ERROR END ===\n');
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}