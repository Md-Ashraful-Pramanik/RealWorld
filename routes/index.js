const express = require('express');

const { sayHello } = require('../controllers/helloController');
const { getTestTableData } = require('../controllers/testDbController');

const router = express.Router();

router.get('/hello', sayHello);
router.get('/test-db', getTestTableData);

module.exports = router;
