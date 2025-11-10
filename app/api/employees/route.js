import { NextResponse } from 'next/server';
import dbConnect from '../../../lib/mongoose';
import Employee from '../../../models/Employee';

export async function GET() {
  try {
    await dbConnect();
    const employees = await Employee.find().sort({ createdAt: -1 });
    return NextResponse.json(employees);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();
    
    const employee = await Employee.create(body);
    return NextResponse.json(employee, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    const body = await request.json();
    const employee = await Employee.findByIdAndUpdate(id, body, { new: true });
    
    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }
    
    return NextResponse.json(employee);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    const employee = await Employee.findByIdAndDelete(id);
    
    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }
    
    return NextResponse.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}