const express = require('express');
const router = express.Router();

const groceries = {
  prices: {
    apple: 1.5,
    banana: 0.5,
    orange: 1.0,
    carrot: 0.75,
    broccoli: 1.25,
    spinach: 2.0,
    milk: 1.5,
    cheese: 2.5,
    yogurt: 1.0
  }
};

const groceryController = {
  createOrder: (req, res) => {
    const { name, shoppingList, budget } = req.body;

    if (!name || !shoppingList || !budget) {
      return res.status(400).json({ error: 'Name, shopping list, and budget are required.' });
    }

    let total = 0;
    let canAfford = [];
    let overBudget = [];

    shoppingList.forEach(item => {
      const price = groceries.prices[item];
      if (!price) return;

      if (total + price <= budget) {
        total += price;
        canAfford.push({ item, price });
      } else {
        overBudget.push({ item, price });
      }
    });

    const remaining = budget - total;

    res.status(201).json({
      shopper: name,
      budget,
      purchased: canAfford,
      overBudget,
      totalSpent: total,
      remainingBudget: remaining
    });
  },

  getPrices: (req, res) => {
    res.json(groceries.prices);
  }
};

// Routes
router.post('/order', groceryController.createOrder);
router.get('/prices', groceryController.getPrices);

module.exports = router;
