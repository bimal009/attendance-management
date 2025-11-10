import { NextResponse } from 'next/server';
import dbConnect from '../../../lib/mongoose';
import Attendance from '../../../models/Attendance';
import Employee from '../../../models/Employee';
import { calculateDistance, OFFICE_LOCATION } from '../../../lib/utils';

export async function GET() {
  try {
    await dbConnect();
    const attendance = await Attendance.find()
      .populate('employeeId')
      .sort({ date: -1 });
    return NextResponse.json(attendance);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { phone, lat, lng } = body;

    // Find employee by phone
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

    // Check if already marked attendance today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingAttendance = await Attendance.findOne({
      employeeId: employee._id,
      date: {
        $gte: today,
        $lt: tomorrow
      }
    });

    if (existingAttendance) {
      return NextResponse.json({ error: 'Attendance already marked for today' }, { status: 400 });
    }

    // Create attendance record
    const attendance = await Attendance.create({
      employeeId: employee._id,
      date: new Date(),
      time: new Date().toLocaleTimeString(),
      location: {
        lat,
        lng,
        distanceFromOffice: Math.round(distance),
        withinRange
      }
    });

    await attendance.populate('employeeId');

    return NextResponse.json(attendance, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}