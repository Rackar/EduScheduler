const express = require("express");
const router = express.Router();
const seedController = require("../controllers/seedController");

router.post("/initialize", seedController.initializeData);

module.exports = router;
