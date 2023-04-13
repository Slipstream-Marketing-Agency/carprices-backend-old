const express = require("express");
const { getAdminBlogs, createBlog, createBlogCategory, getAdminBlogCategory, updateBlogCategory } = require("../../controllers/blog");
const router = express.Router();
const { protect } = require("../../middlewares/auth");

router.route("/").get(protect, getAdminBlogs).post(protect, createBlog);
router.route("/category").get(protect, getAdminBlogCategory).post(protect, createBlogCategory);
router.route("/category/:category").post(protect, updateBlogCategory);

module.exports = router;
