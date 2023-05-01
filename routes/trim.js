const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/auth");
const { getTrimsByModel, getTrimsBySlug, getTrimsYearByModel, getTrimsBySlugAndYear, getTrimsByFilter, getTrimsBodyType, getTrimsFuelType, getTrimsByAdvancedSearch, getTrimsBySlugAndYearWithModel, getCompareTrims, getTrimsByModelMin, getTrimsByModelMinAndYear } = require("../controllers/trim");

router.route("/by-model/:model").get(getTrimsByModel);
router.route("/by-model/min/:model").get(getTrimsByModelMin);
router.route("/by-model/min/:model/:year").get(getTrimsByModelMinAndYear);
router.route("/compare/:slug").get(getCompareTrims);
router.route("/:trim").get(getTrimsBySlug);
router.route("/get-years/:modelId").get(getTrimsYearByModel);
router.route("/filter/list").get(getTrimsByFilter);
router.route("/body-type/list").get(getTrimsBodyType);
router.route("/fuel-type/list").get(getTrimsFuelType)
router.route("/filter/advanced").post(getTrimsByAdvancedSearch)
router.route("/:trim/:year").get(getTrimsBySlugAndYear);
router.route("/:model/:trim/:year").get(getTrimsBySlugAndYearWithModel);

router.route("/recommended").get(getRecommendedTrims)


module.exports = router;
