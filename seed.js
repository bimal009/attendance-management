import dbConnect from "./lib/mongoose.js";
import bcryptjs from "bcryptjs";
import User from "./models/user.js";

async function seedUser() {
  try {
    // Connect to the database
    await dbConnect();

    const username = "admin";
    const email = "synthbit@group.com";
    const password = "synthbit@123@@@";

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log("User already exists");
      return process.exit(0);
    }

    // Hash the password
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(password, salt);

    // Create and save the user
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
    });

    await newUser.save();
    console.log("User seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding user:", error);
    process.exit(1);
  }
}

seedUser();
