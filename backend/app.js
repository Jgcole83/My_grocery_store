const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Simulate a simple in-memory "database" for users
let users = [
  { email: "test@example.com", password: "password123" },
];

// EmailService class for sending emails
class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "your-email@gmail.com",
        pass: "your-email-password",
      },
    });
  }

  sendPasswordResetEmail(to, resetLink) {
    const mailOptions = {
      from: "your-email@gmail.com",
      to: to,
      subject: "Password Reset Request",
      text: `Click the following link to reset your password: ${resetLink}`,
    };

    return new Promise((resolve, reject) => {
      this.transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
          reject("Failed to send reset email");
        }
        resolve("Password reset link sent to email");
      });
    });
  }
}

// User class to manage user-related operations
class User {
  static findByEmail(email) {
    return users.find((user) => user.email === email);
  }
}

// PasswordReset class to manage reset functionality
class PasswordReset {
  constructor(userEmail) {
    this.userEmail = userEmail;
  }

  generateResetToken() {
    return crypto.randomBytes(20).toString("hex");
  }

  // Simulate saving the reset token (in a real app, you would store it in a database)
  static storeToken(token) {
    // Here you'd save the token in the DB with an expiration time
    console.log(`Stored token: ${token}`);
  }

  async initiateReset() {
    const user = User.findByEmail(this.userEmail);
    if (!user) {
      throw new Error("User not found");
    }

    // Generate reset token
    const resetToken = this.generateResetToken();

    // Store the token in the database (simulated here)
    PasswordReset.storeToken(resetToken);

    // Send the reset link to the user's email
    const resetLink = `http://localhost:5000/reset-password/${resetToken}`;
    const emailService = new EmailService();
    const emailResponse = await emailService.sendPasswordResetEmail(
      this.userEmail,
      resetLink
    );
    return emailResponse;
  }
}

// Forgot password endpoint
app.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  const user = User.findByEmail(email);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  try {
    const passwordReset = new PasswordReset(email);
    const message = await passwordReset.initiateReset();
    res.status(200).json({ message });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
