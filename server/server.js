// server.js - Fixed version
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();
const app = express();

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    credentials: true,
  })
);

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(
      process.env.MONGO_URI || "mongodb://127.0.0.1:27017/AnimeWorldUsers"
    );
    console.log("✅ MongoDB Connected Successfully");
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error.message);
    process.exit(1);
  }
};

connectDB();

// User Schema
const userSchema = new mongoose.Schema({
  uid: { type: String, required: true },
  username: { type: String },
  firstName: String,
  lastName: String,
  displayName: String,
  email: String,
  phone: String,
  countryCode: { type: String, default: "+91" },
  googleAuth: { type: Boolean, default: false },
  phoneAuth: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date, default: Date.now },
});

const User = mongoose.model("User", userSchema);

// Store user data
app.post("/api/users", async (req, res) => {
  try {
    console.log("📥 Received user data:", req.body);

    const {
      uid,
      username,
      firstName,
      lastName,
      displayName,
      email,
      phone,
      countryCode,
      googleAuth,
      phoneAuth,
    } = req.body;

    if (!uid) {
      return res.status(400).json({ error: "User ID (uid) is required" });
    }

    // Check if user already exists by UID or email
    let existingUser = await User.findOne({
      $or: [{ uid }, { email }],
    });

    if (existingUser) {
      // Update last login
      existingUser.lastLogin = new Date();
      await existingUser.save();
      console.log("✅ User updated:", existingUser.email);
      return res.status(200).json({
        message: "User login updated",
        user: existingUser,
      });
    }

    // Create new user with fallback values
    const userData = {
      uid,
      username:
        username || (email ? email.split("@")[0] : `user_${uid.slice(0, 8)}`),
      firstName: firstName || "User",
      lastName: lastName || "",
      displayName:
        displayName ||
        (firstName && lastName ? `${firstName} ${lastName}` : "User"),
      email: email || null,
      phone: phone || null,
      countryCode: countryCode || "+91",
      googleAuth: googleAuth || false,
      phoneAuth: phoneAuth || false,
    };

    const user = new User(userData);
    await user.save();

    console.log("✅ New user created:", user.email);
    res.status(201).json({
      message: "User saved successfully",
      user,
    });
  } catch (error) {
    console.error("❌ Error in /api/users:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
});

// Get all users with better error handling
app.get("/api/users", async (req, res) => {
  try {
    console.log("📤 Fetching all users...");

    const users = await User.find().sort({ createdAt: -1 });

    console.log(`✅ Found ${users.length} users`);

    res.json(users);
  } catch (error) {
    console.error("❌ Error fetching users:", error);
    res.status(500).json({
      error: "Failed to fetch users",
      details: error.message,
    });
  }
});

// Get user by ID
app.get("/api/users/:uid", async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.params.uid });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  const dbStatus =
    mongoose.connection.readyState === 1 ? "Connected" : "Disconnected";
  console.log(`🏥 Health check - Database: ${dbStatus}`);
  res.json({
    status: "Server is running",
    timestamp: new Date().toISOString(),
    database: dbStatus,
    databaseName: mongoose.connection.name,
  });
});

// Test endpoint with sample data
app.get("/api/test-data", async (req, res) => {
  try {
    // Create sample test user
    const testUser = new User({
      uid: "test_uid_123",
      username: "testuser",
      firstName: "Test",
      lastName: "User",
      displayName: "Test User",
      email: "test@animeworld.com",
      googleAuth: false,
      phoneAuth: false,
    });

    await testUser.save();
    res.json({ message: "Test user created", user: testUser });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`👥 Users API: http://localhost:${PORT}/api/users`);
});
