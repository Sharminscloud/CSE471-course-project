const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const appointmentRoutes = require('./routes/appointments');
const slotRoutes = require('./routes/slots');

dotenv.config();

connectDB();

const app = express();
const PORT = process.env.PORT || 1188;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/', (req, res) => {
  res.json({ message: 'EQueue backend is running', port: PORT });
});

app.use('/api/appointments', appointmentRoutes);
app.use('/api/slots', slotRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please stop the process using it or change PORT in your environment.`);
  } else {
    console.error('Server error:', err);
  }
  process.exit(1);
});
