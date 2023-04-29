const express = require("express");
const router = express.Router();
const {
  getCarBrands, mainSearch,
} = require("../controllers/common");
const { getTrimMinMaxFilterPrice } = require("../controllers/trim");
const { protect } = require("../middlewares/auth");

router.route("/brands").get(getCarBrands);
router.route("/filter/get-min-max").get(getTrimMinMaxFilterPrice);
router.route("/search/:keyword").get(mainSearch);

module.exports = router;
