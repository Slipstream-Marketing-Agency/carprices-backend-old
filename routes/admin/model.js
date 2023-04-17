const express = require("express");
const { getAdminModels, createModel, updateModel, setHighTrim, setFeaturedModels, removeFeaturedModels, getAdminFeaturedModels, getAdminElectricFeaturedModels, setElectricFeaturedModels, removeElectricFeaturedModels } = require("../../controllers/model");
const router = express.Router();
const { protect } = require("../../middlewares/auth");

router.route("/").get(protect, getAdminModels).post(protect, createModel);
router.route("/set-trim/:trim").post(protect, setHighTrim);
router.route("/featured").get(protect, getAdminFeaturedModels).post(protect, setFeaturedModels)
router.route("/featured/remove").post(protect, removeFeaturedModels)
router.route("/electric/featured").get(protect, getAdminElectricFeaturedModels).post(protect, setElectricFeaturedModels)
router.route("/electric/featured/remove").post(protect, removeElectricFeaturedModels)
router.route("/:model").post(protect, updateModel);

module.exports = router;
