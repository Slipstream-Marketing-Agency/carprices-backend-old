const express = require("express");
const { getCarBrandBySlug } = require("../controllers/brand");
const router = express.Router();
const { protect } = require("../middlewares/auth");

router.route("/by-slug/:slug").get(getCarBrandBySlug);

module.exports = router;