const express = require('express');
const router = express.Router();
const { getAllRecords, createRecord } = require('../controllers/participationController');

router.get('/', getAllRecords);
router.post('/', createRecord);

module.exports = router;