const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const groceryRoutes = require('./routes'); // routes.js is imported

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Use your routes
app.use('/api', groceryRoutes);

app.get('/', (req, res) => {
  res.send('🛒 Grocery API is live!');
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
