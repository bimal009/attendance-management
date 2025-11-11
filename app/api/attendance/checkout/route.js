// app/api/attendance/checkout/route.js
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

// Calculate hours between two timestamps
function calculateHours(checkInTime, checkOutTime) {
  const checkIn = new Date(`1970-01-01 ${checkInTime}`);
  const checkOut = new Date(`1970-01-01 ${checkOutTime}`);
  
  let diffMs = checkOut - checkIn;
  
  // If check-out is earlier than check-in, assume it's the next day
  if (diffMs < 0) {
    diffMs += 24 * 60 * 60 * 1000;
  }
  
  const diffHours = diffMs / (1000 * 60 * 60);
  return Math.round(diffHours * 100) / 100;
}

export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { phone, lat, lng } = body;

    console.log('=== CHECK-OUT REQUEST START ===');
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

    // Find today's attendance record with check-in
    const todayAttendance = await Attendance.findOne({
      employeeId: employee._id,
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    });

    console.log('Today\'s attendance record:', {
      found: !!todayAttendance,
      recordId: todayAttendance?._id,
      hasCheckIn: !!todayAttendance?.checkIn,
      checkInTime: todayAttendance?.checkIn?.time,
      hasCheckOut: !!todayAttendance?.checkOut,
      checkOutTime: todayAttendance?.checkOut?.time,
      checkOutExists: todayAttendance?.checkOut ? 'YES' : 'NO',
      checkOutTimeExists: todayAttendance?.checkOut?.time ? 'YES' : 'NO'
    });

    // Validation: Check if attendance record exists
    if (!todayAttendance) {
      console.log('ERROR: No attendance record found for today');
      return NextResponse.json({ 
        error: 'No check-in record found for today. Please check in first.' 
      }, { status: 400 });
    }

    // Validation: Check if check-in exists
    if (!todayAttendance.checkIn || !todayAttendance.checkIn.time) {
      console.log('ERROR: Check-in data missing');
      return NextResponse.json({ 
        error: 'No check-in found for today. Please check in first.' 
      }, { status: 400 });
    }

    // Validation: Check if already checked out (check both existence and time field)
    if (todayAttendance.checkOut && todayAttendance.checkOut.time) {
      console.log('ERROR: Already checked out', {
        checkOutTime: todayAttendance.checkOut.time
      });
      return NextResponse.json({ 
        error: 'Already checked out today',
        attendance: todayAttendance
      }, { status: 400 });
    }

    // All validations passed
    console.log('✓ All validations passed. Proceeding with checkout...');
    console.log('Check-in time:', todayAttendance.checkIn.time);
    console.log('Check-out time:', currentTime);

    const locationData = {
      lat,
      lng,
      distanceFromOffice: Math.round(distance),
      withinRange,
      timestamp: new Date()
    };

    // Calculate total hours
    const totalHours = calculateHours(todayAttendance.checkIn.time, currentTime);
    console.log('Total hours calculated:', totalHours);

    // Update using findByIdAndUpdate to avoid any potential conflicts
    const updatedAttendance = await Attendance.findByIdAndUpdate(
      todayAttendance._id,
      {
        $set: {
          checkOut: {
            time: currentTime,
            timestamp: currentTimestamp,
            location: locationData
          },
          totalHours: totalHours,
          workHours: totalHours,
          status: totalHours < 4 ? 'half-day' : 'present'
        }
      },
      { 
        new: true, // Return the updated document
        runValidators: true 
      }
    ).populate('employeeId');

    if (!updatedAttendance) {
      console.log('ERROR: Failed to update attendance');
      return NextResponse.json({ 
        error: 'Failed to update attendance record' 
      }, { status: 500 });
    }

    console.log('✓ Check-out successful:', {
      id: updatedAttendance._id,
      checkInTime: updatedAttendance.checkIn.time,
      checkOutTime: updatedAttendance.checkOut.time,
      totalHours: updatedAttendance.totalHours
    });
    console.log('=== CHECK-OUT REQUEST END ===\n');

    return NextResponse.json({ 
      message: 'Checked out successfully',
      attendance: updatedAttendance,
      totalHours 
    }, { status: 200 });

  } catch (error) {
    console.error('=== CHECK-OUT ERROR ===');
    console.error('Error:', error);
    console.error('Stack:', error.stack);
    console.error('=== ERROR END ===\n');
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}