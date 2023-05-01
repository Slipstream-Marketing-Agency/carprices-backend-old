const express = require("express");
const router = express.Router();
const {
  getCarBrands, mainSearch,
} = require("../controllers/common");
const { getTrimMinMaxFilterPrice, getTrimMinMaxFilterPower, getTrimMinMaxFilterTorque } = require("../controllers/trim");
const { protect } = require("../middlewares/auth");

router.route("/brands").get(getCarBrands);
router.route("/filter/get-min-max").get(getTrimMinMaxFilterPrice);
router.route("/filter/power/get-min-max").get(getTrimMinMaxFilterPower);
router.route("/filter/torque/get-min-max").get(getTrimMinMaxFilterTorque);
router.route("/search/:keyword").get(mainSearch);

module.exports = router;
