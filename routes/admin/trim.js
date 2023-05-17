const express = require("express");
const { getAdminTrims, createTrim, updateTrim, getAdminTrimById } = require("../../controllers/trim");
const router = express.Router();
const { protect } = require("../../middlewares/auth");

router.route("/").get(protect, getAdminTrims).post(protect, createTrim);
router.route("/:trim").get(protect, getAdminTrimById).put(protect, updateTrim);

module.exports = router;
