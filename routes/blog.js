const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/auth");
const { getAdminBlogs, getBlogs, getBlogBySlug, getBlogsByModel, getBlogsByBrand, getBlogsMin, getBlogsByTag } = require("../controllers/blog");

router.route("/").get(getBlogs)
router.route("/min").get(getBlogsMin)
router.route("/:slug").get(getBlogBySlug)
router.route("/by-model/:model").get(getBlogsByModel)
router.route("/by-brand/:brand").get(getBlogsByBrand)
router.route("/by-tag/:tag").get(getBlogsByTag)




module.exports = router;
