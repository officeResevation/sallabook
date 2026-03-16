require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { testConnection } = require('./config/db');

const app = express();

// Middleware
app.use(cors({ origin: '*', credentials: false }));
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/rooms', require('./routes/rooms'));
app.use('/api/reservations', require('./routes/reservations'));
app.use('/api/admin', require('./routes/admin'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Serveri po punon! 🚀' });
});

// 404
app.use((req, res) => {
  res.status(404).json({ message: 'Rruga nuk u gjet' });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await testConnection();
  app.listen(PORT, () => {
    console.log(`🚀 Serveri po punon në http://localhost:${PORT}`);
  });
};
startServer();
