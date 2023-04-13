const express = require("express");
const router = express.Router();
const {
  getCarBrands,
} = require("../controllers/common");
const { protect } = require("../middlewares/auth");

router.route("/common/car-brands").get(getCarBrands);

module.exports = router;
