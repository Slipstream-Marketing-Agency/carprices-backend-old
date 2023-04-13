const express = require("express");
const { getAdminBrands, createBrand } = require("../../controllers/brand");
const router = express.Router();
const { protect } = require("../../middlewares/auth");

router.route("/").get(protect, getAdminBrands).post(protect, createBrand);

module.exports = router;
