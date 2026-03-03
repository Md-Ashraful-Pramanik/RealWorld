const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const pool = require('./config/db');

dotenv.config();

const app = express();

app.use(cors());

app.use(express.json());

app.get('/hello', (req, res) => {
  res.status(200).send('hello world');
});

app.get('/test-db', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM test');
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching test table:', error);
    res.status(500).json({ error: 'Failed to fetch test table' });
  }
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

module.exports = app;
