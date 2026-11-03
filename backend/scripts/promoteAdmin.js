import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "../models/User.js";

dotenv.config();

const email = process.argv[2];

if (!email) {
  console.log("Usage: node scripts/promoteAdmin.js <user-email>");
  process.exit(1);
}

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      console.log(`User with email "${email}" not found.`);
      process.exit(1);
    }
    user.role = "admin";
    await user.save();
    console.log(`User "${user.name}" (${user.email}) successfully promoted to admin!`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
}

run();
