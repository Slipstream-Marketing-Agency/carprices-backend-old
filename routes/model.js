const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/auth");
const { getModels, getFeaturedModels, getElectricFeaturedModels, getModelsByBrand, getModelsByBrandAndYear, getModelsByBrandSlug, getModelsByBrandAndYearSlug, getModelsByBrandMin, getModelsBySlug, searchModels, topMostSearchedCars, compareCarModels } = require("../controllers/model");

router.route("/").get(getModels);
router.route("/search").get(searchModels);
router.route("/top-searched").get(topMostSearchedCars);
router.route("/compare-car/list").get(compareCarModels)
router.route("/by-brand/:brand").get(getModelsByBrand)
router.route("/by-brand/min/:brand").get(getModelsByBrandMin)
router.route("/by-brand-year/:brand/:year").get(getModelsByBrandAndYear)
router.route("/by-brand/slug/:brand").get(getModelsByBrandSlug)
router.route("/by-brand-year/slug/:brand/:year").get(getModelsByBrandAndYearSlug)
router.route("/featured").get(getFeaturedModels);
router.route("/featured/electric").get(getElectricFeaturedModels);
router.route("/:model").get(getModelsBySlug);

module.exports = router;
