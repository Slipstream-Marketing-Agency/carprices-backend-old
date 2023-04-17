const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/auth");
const { getTrimsByModel } = require("../controllers/trim");

router.route("/by-model/:model").get(getTrimsByModel);

module.exports = router;
