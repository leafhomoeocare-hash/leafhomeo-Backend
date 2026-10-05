const express = require("express");
const router = express.Router();
const authmiddleware = require("../middleware/auth");
const blogController = require("../controller/admin/blogController");

// Admin blog routes
router.post("/create", authmiddleware, blogController.CreateBlog);
router.post("/get-all", authmiddleware, blogController.GetAllBlogs);
router.post("/get-by-id", authmiddleware, blogController.GetBlogById);
router.post("/update", authmiddleware, blogController.UpdateBlog);
router.post("/delete", authmiddleware, blogController.DeleteBlog);
router.post("/get-authors", authmiddleware, blogController.GetAuthors);

module.exports = router;