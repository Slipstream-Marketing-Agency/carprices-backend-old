const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/auth");
const { getModels, getFeaturedModels, getElectricFeaturedModels } = require("../controllers/model");

router.route("/").get(getModels);
router.route("/featured").get(getFeaturedModels);
router.route("/featured/electric").get(getElectricFeaturedModels);

module.exports = router;
