const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/auth");
const { getAdminBlogs, getBlogs, getBlogBySlug, getBlogsByModel } = require("../controllers/blog");

router.route("/").get(getBlogs)
router.route("/:slug").get(getBlogBySlug)
router.route("/by-model/:model").get(getBlogsByModel)


module.exports = router;
