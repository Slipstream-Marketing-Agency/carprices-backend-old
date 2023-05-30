const express = require("express");
const { getAdminTrims, createTrim, updateTrim, getAdminTrimById, changeTrimData } = require("../../controllers/trim");
const router = express.Router();
const { protect } = require("../../middlewares/auth");

router.route("/").get(protect, getAdminTrims).post(protect, createTrim);
router.route("/:trim").get(protect, getAdminTrimById).put(protect, updateTrim);

router.route("/change/data").post(changeTrimData)

module.exports = router;
