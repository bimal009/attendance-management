import { NextResponse } from "next/server";
import bcryptjs from "bcryptjs";
import User from "../../../models/user";
import dbConnect from "../../../lib/mongoose";

await dbConnect(); // Establish database connection
export async function GET() {
  try {
    const username = "admin"; // default username
    const email = "synthbit@group.com"; // default email
    const password = "synthbit@123@@@"; // default password

    // Check if the user already exists
    const user = await User.findOne({ email });
    if (user) {
      return NextResponse.json({ message: "User already exists", success: false });
    }

    // Hash password
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(password, salt);

    // Create and save user
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
    });

    await newUser.save();

    return NextResponse.json({
      message: "User created successfully",
      success: true,
      user: {
        username,
        email,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
