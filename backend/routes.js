const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const bodyParser = require("body-parser");

// In-memory storage for users and orders (can be replaced with database)
let users = [
  { email: "test@example.com", password: "password123", name: "Test User", budget: 50 }
];
let orders = [];
let resetTokens = {};

function calculateTotal(orderItems) {
  let total = 0;
  orderItems.forEach(({ item, quantity, price }) => {
    total += quantity * price;
  });
  return total;
}

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "your-email@gmail.com",  // Use a real email for sending emails
        pass: "your-password"           // Use the real email password
      }
    });
  }

  sendPasswordResetEmail(to, resetLink) {
    const mailOptions = {
      from: "your-email@gmail.com",
      to,
      subject: "Reset Password",
      text: `Reset your password: ${resetLink}`
    };

    return new Promise((resolve, reject) => {
      this.transporter.sendMail(mailOptions, (err) => {
        if (err) reject("Failed to send reset email");
        else resolve("Reset email sent");
      });
    });
  }
}

class User {
  static findByEmail(email) {
    return users.find(user => user.email === email);
  }

  static updatePassword(email, newPassword) {
    const user = this.findByEmail(email);
    if (user) user.password = newPassword;
  }
}

// CATEGORIZED PRODUCTS
const categorizedProducts = {
  produce: [
    { item: "Apples", price: 1.2 },
    { item: "Bananas", price: 0.5 },
    { item: "Carrots", price: 0.8 }
  ],
  dairy: [
    { item: "Milk", price: 2.5 },
    { item: "Cheese", price: 3.0 }
  ],
  snacks: [
    { item: "Chips", price: 1.8 },
    { item: "Cookies", price: 2.2 }
  ]
};

// User Registration
router.post("/register", (req, res) => {
  const { name, email, password, address, city, state, phone, budget } = req.body;
  if (User.findByEmail(email)) {
    return res.status(400).json({ error: "User already exists" });
  }
  users.push({ name, email, password, address, city, state, phone, budget });
  res.status(201).json({ message: "Registration successful" });
});

// User Login
router.post("/login", (req, res) => {
  const { email, password } = req.body;
  const user = User.findByEmail(email);
  if (!user || user.password !== password) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  res.status(200).json({ message: "Login successful" });
});

// Forgot Password (Send Reset Email)
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  const user = User.findByEmail(email);
  if (!user) return res.status(404).json({ error: "User not found" });

  try {
    const token = crypto.randomBytes(20).toString("hex");
    resetTokens[token] = email;
    const resetLink = `http://localhost:5000/reset-password.html?token=${token}`;
    const emailService = new EmailService();
    await emailService.sendPasswordResetEmail(email, resetLink);
    res.status(200).json({ message: "Reset email sent" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Password Reset (After User Clicks the Reset Link)
router.post("/reset-password", (req, res) => {
  const { token, newPassword } = req.body;
  const email = resetTokens[token];
  if (!email) return res.status(400).json({ error: "Invalid or expired token" });

  User.updatePassword(email, newPassword);
  delete resetTokens[token];
  res.status(200).json({ message: "Password successfully updated!" });
});

// Get Grocery Items
router.get("/api/grocery-items", (req, res) => {
  res.json(categorizedProducts);
});

// Place an Order (Check Total Cost Against Budget)
router.post("/orders", (req, res) => {
  const { userId, shoppingList, budget } = req.body;

  // Calculate the total cost of the order
  const total = calculateTotal(shoppingList);

  if (total > budget) {
    return res.status(400).json({ error: "You do not have enough funds for this order" });
  }

  // Create the order
  const order = {
    userId,
    shoppingList,
    total
  };

  orders.push(order);
  res.status(200).json({ message: "Order placed successfully", order });
});

module.exports = router;
