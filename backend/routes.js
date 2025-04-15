const express = require('express');
const router = express.Router();
const crypto = require('crypto'); // For generating reset tokens
const nodemailer = require('nodemailer'); // To send reset email
const bcrypt = require('bcrypt'); // For hashing passwords

// Simulate a simple database for users and orders (using in-memory storage for now)
let users = [];
let orders = [];
let passwordResetTokens = {}; // Store reset tokens temporarily

let groceryPrices = {
  apple: 1.5,
  banana: 0.5,
  orange: 1.0,
  carrot: 0.75,
  broccoli: 1.25,
  spinach: 2.0,
  milk: 1.5,
  cheese: 2.5,
  yogurt: 1.0,
};

// User class to handle user-related actions
class User {
  constructor(name, email, password, address, phoneNumber) {
    this.name = name;
    this.email = email;
    this.password = password;
    this.address = address;
    this.phoneNumber = phoneNumber;
  }

  static findUserByEmail(email) {
    return users.find(user => user.email === email);
  }

  static createUser(name, email, password, address, phoneNumber) {
    const newUser = new User(name, email, password, address, phoneNumber);
    users.push(newUser);
    return newUser;
  }

  static updateUserPassword(email, newPassword) {
    const user = User.findUserByEmail(email);
    if (user) {
      user.password = bcrypt.hashSync(newPassword, 10); // Hash new password
    }
  }
}

// Grocery class to handle order-related actions
class Grocery {
  static createOrder(userId, shoppingList, budget) {
    let totalCost = 0;
    const selectedItems = [];

    shoppingList.forEach(item => {
      if (groceryPrices[item]) {
        const price = groceryPrices[item];
        if (totalCost + price <= budget) {
          selectedItems.push({ item, price });
          totalCost += price;
        }
      }
    });

    if (totalCost <= budget) {
      orders.push({ userId, shoppingList, selectedItems, totalCost, remainingBudget: budget - totalCost });
      return { message: 'Order placed successfully!', order: { userId, shoppingList, selectedItems, totalCost, remainingBudget: budget - totalCost } };
    } else {
      return { error: 'Total cost exceeds budget' };
    }
  }

  static getAllOrders() {
    return orders;
  }
}

// PasswordReset class to handle password reset functionality
class PasswordReset {
  static generateResetToken() {
    return crypto.randomBytes(20).toString('hex');
  }

  static sendResetEmail(email, token) {
    const resetUrl = `http://your-domain.com/reset-password/${token}`; // Update this URL as per your environment
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'your-email@gmail.com',
        pass: 'your-email-password',
      },
    });

    transporter.sendMail({
      from: 'your-email@gmail.com',
      to: email,
      subject: 'Password Reset Request',
      text: `Please click the link to reset your password: ${resetUrl}`,
    }, (err, info) => {
      if (err) {
        return { error: 'Failed to send reset email' };
      }
      return { message: 'Password reset email sent successfully!' };
    });
  }
}

// Routes related to users
router.post('/register', (req, res) => {
  const { name, email, password, address, phoneNumber } = req.body;
  if (!name || !email || !password || !address || !phoneNumber) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const newUser = User.createUser(name, email, password, address, phoneNumber);
  return res.status(201).json({ message: 'User registered successfully!', user: newUser });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = User.findUserByEmail(email);
  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  return res.status(200).json({ message: 'Login successful', user });
});

// Routes related to password reset
router.post('/forgot-password', (req, res) => {
  const { email } = req.body;
  const user = User.findUserByEmail(email);
  
  if (!user) {
    return res.status(404).json({ error: 'No user found with that email address' });
  }

  const resetToken = PasswordReset.generateResetToken();
  passwordResetTokens[resetToken] = email;

  const emailResponse = PasswordReset.sendResetEmail(email, resetToken);
  if (emailResponse.error) {
    return res.status(500).json({ error: emailResponse.error });
  }
  res.status(200).json({ message: emailResponse.message });
});

router.post('/reset-password/:token', async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  const email = passwordResetTokens[token];
  if (!email) {
    return res.status(400).json({ error: 'Invalid or expired token' });
  }

  User.updateUserPassword(email, password);

  delete passwordResetTokens[token]; // Remove the token after use
  res.status(200).json({ message: 'Password has been successfully reset' });
});

// Routes related to grocery orders
router.post('/orders', (req, res) => {
  const { userId, shoppingList, budget } = req.body;
  if (!userId || !shoppingList || !budget) {
    return res.status(400).json({ error: 'User ID, shopping list, and budget are required' });
  }

  const orderResponse = Grocery.createOrder(userId, shoppingList, budget);
  if (orderResponse.error) {
    return res.status(400).json({ error: orderResponse.error });
  }

  return res.status(201).json(orderResponse);
});

router.get('/orders', (req, res) => {
  const allOrders = Grocery.getAllOrders();
  return res.status(200).json({ orders: allOrders });
});

module.exports = router;
