const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const routes = require('./routes');
const { sendNotFound } = require('./utils/response');
const { auditLogger } = require('./middleware/audit');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(auditLogger);

app.use('/', routes);

app.use((req, res) => {
  sendNotFound(res);
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = app;
