const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const pool = require('./config/db');
const { initializeDb } = require('./config/initDb');
const apiRoutes = require('./routes');

dotenv.config();

const app = express();

app.use(cors());

app.use(express.json());

app.use('/api', apiRoutes);

app.get('/hello', (req, res) => {
  res.status(200).send('hello world');
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal Server Error' });
});

const port = process.env.PORT || 3000;
initializeDb(pool)
  .then(() => {
    app.listen(port, () => {
      console.log(`Server listening on port ${port}`);
    });
  })
  .catch((error) => {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  });

module.exports = app;
