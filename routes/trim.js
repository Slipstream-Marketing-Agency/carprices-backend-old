const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/auth");
const { getTrimsByModel, getTrimsBySlug, getTrimsYearByModel, getTrimsBySlugAndYear } = require("../controllers/trim");

router.route("/by-model/:model").get(getTrimsByModel);
router.route("/:trim").get(getTrimsBySlug);
router.route("/get-years/:modelId").get(getTrimsYearByModel);
router.route("/:trim/:year").get(getTrimsBySlugAndYear);


module.exports = router;
