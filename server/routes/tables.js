
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/tables');

router.get('/tables', ctrl.listTables);
router.post('/tables/:id/join', ctrl.joinTable);
router.get('/me/active-table', ctrl.myActiveTable);

module.exports = router;
