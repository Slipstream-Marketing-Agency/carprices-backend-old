const express = require("express");
const { getAdminTrims, createTrim, updateTrim } = require("../../controllers/trim");
const router = express.Router();
const { protect } = require("../../middlewares/auth");

router.route("/").get(protect, getAdminTrims).post(protect, createTrim);
router.route("/:trim").post(protect, updateTrim);

module.exports = router;
