const Blog = require("../../models/Blog");
const User = require("../../models/User");
const Doctor = require("../../models/Doctor");
const { Op } = require("sequelize");
const path = require("path");

exports.CreateBlog = async (req, res, next) => {
  try {
    console.log("=== CREATE BLOG ===");
    console.log("Req body:", req.body);
    console.log("Req file:", req.file);

    const {
      title,
      description,
      authorType,
      authorId,
      blogType,
    } = req.body;

    // Handle image from multer - convert absolute path to relative
    let image = null;
    if (req.file) {
      image = req.file.path; // Only store filename, not full path
      console.log("Image filename:", image);
    } else if (req.body.image) {
      image = req.body.image;
      console.log("Image from body:", image);
    }

    // Validate author exists
    const author = await User.findByPk(authorId, {
      where: { isDeleted: false },
    });

    if (!author) {
      return res.status(404).json({
        status: 0,
        message: "Author not found",
      });
    }

    // Validate author type matches
    if (author.role !== authorType) {
      return res.status(400).json({
        status: 0,
        message: `Author type mismatch. User is ${author.role} but authorType is ${authorType}`,
      });
    }

    // If author is doctor, validate doctor profile exists
    if (authorType === "doctor") {
      const doctor = await Doctor.findOne({
        where: { userId: authorId, isDeleted: false },
      });
      if (!doctor) {
        return res.status(404).json({
          status: 0,
          message: "Doctor profile not found",
        });
      }
    }

    const blogData = {
      title,
      description,
      authorType,
      authorId,
      blogType,
      image,
    };

    console.log("Creating blog with data:", blogData);

    const blog = await Blog.create(blogData);

    return res.status(201).json({
      status: 1,
      message: "Blog created successfully",
      data: blog,
    });
  } catch (error) {
    console.log(error, "ERROR");
    next(error);
  }
};

exports.GetAllBlogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.body;

    const offset = (page - 1) * Number(limit);

    const where = {
      isDeleted: false,
    };

    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { count, rows } = await Blog.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: "author",
          attributes: ["id", "name", "email", "image", "role"],
          where: { isDeleted: false },
          required: true,
        },
        {
          model: Doctor,
          as: "doctorAuthor",
          attributes: ["id", "specialization", "qualification"],
          required: false,
        },
      ],
      distinct: true,
      limit: Number(limit),
      offset,
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      status: 1,
      message: "Blogs fetched successfully",
      data: {
        blogs: rows,
        totalRecords: count,
        currentPage: Number(page),
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.log(error, "ERROR");
    next(error);
  }
};

exports.GetBlogById = async (req, res, next) => {
  try {
    const { blogId } = req.body;

    const blog = await Blog.findByPk(blogId, {
      where: { isDeleted: false },
      include: [
        {
          model: User,
          as: "author",
          attributes: ["id", "name", "email", "image", "role"],
          where: { isDeleted: false },
          required: true,
        },
        {
          model: Doctor,
          as: "doctorAuthor",
          attributes: ["id", "specialization", "qualification"],
          required: false,
        },
      ],
    });

    if (!blog) {
      return res.status(404).json({
        status: 0,
        message: "Blog not found",
      });
    }

    return res.status(200).json({
      status: 1,
      message: "Blog fetched successfully",
      data: blog,
    });
  } catch (error) {
    console.log(error, "ERROR");
    next(error);
  }
};

exports.UpdateBlog = async (req, res, next) => {
  try {
    console.log("=== UPDATE BLOG ===");
    console.log("Req body:", req.body);
    console.log("Req file:", req.file);

    const {
      id,
      title,
      description,
      authorType,
      authorId,
      blogType,
    } = req.body;

    // Handle image from multer - convert absolute path to relative
    let image = undefined;
    if (req.file) {
      image = req.file.filename; // Only store filename, not full path
      console.log("Image filename:", image);
    } else if (req.body.image) {
      image = req.body.image;
      console.log("Image from body:", image);
    }

    const blog = await Blog.findByPk(id, {
      where: { isDeleted: false },
    });

    if (!blog) {
      return res.status(404).json({
        status: 0,
        message: "Blog not found",
      });
    }

    // Validate author exists if changing author
    if (authorId && authorId !== blog.authorId) {
      const author = await User.findByPk(authorId, {
        where: { isDeleted: false },
      });

      if (!author) {
        return res.status(404).json({
          status: 0,
          message: "Author not found",
        });
      }

      if (author.role !== authorType) {
        return res.status(400).json({
          status: 0,
          message: `Author type mismatch. User is ${author.role} but authorType is ${authorType}`,
        });
      }

      if (authorType === "doctor") {
        const doctor = await Doctor.findOne({
          where: { userId: authorId, isDeleted: false },
        });
        if (!doctor) {
          return res.status(404).json({
            status: 0,
            message: "Doctor profile not found",
          });
        }
      }
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (authorType !== undefined) updateData.authorType = authorType;
    if (authorId !== undefined) updateData.authorId = authorId;
    if (blogType !== undefined) updateData.blogType = blogType;
    if (image !== undefined) updateData.image = image;

    console.log("Updating blog with data:", updateData);

    await blog.update(updateData);

    return res.status(200).json({
      status: 1,
      message: "Blog updated successfully",
    });
  } catch (error) {
    console.log(error, "ERROR");
    next(error);
  }
};

exports.DeleteBlog = async (req, res, next) => {
  try {
    const { blogId } = req.body;

    const blog = await Blog.findByPk(blogId);

    if (!blog) {
      return res.status(404).json({
        status: 0,
        message: "Blog not found",
      });
    }

    // Soft delete
    await blog.update({
      isDeleted: true,
      deletedAt: new Date(),
    });

    return res.status(200).json({
      status: 1,
      message: "Blog deleted successfully",
    });
  } catch (error) {
    console.log(error, "ERROR");
    next(error);
  }
};

exports.GetAuthors = async (req, res, next) => {
  try {
    const { type } = req.body;

    const where = {
      isDeleted: false,
    };

    if (type === "admin") {
      where.role = "admin";
    } else if (type === "doctor") {
      where.role = "doctor";
    }

    const users = await User.findAll({
      where,
      attributes: ["id", "name", "email", "role"],
      include: type === "doctor"
        ? [
            {
              model: Doctor,
              as: "doctorProfile",
              attributes: ["id", "specialization", "qualification"],
              where: { isDeleted: false },
              required: true,
            },
          ]
        : [],
    });

    return res.status(200).json({
      status: 1,
      message: "Authors fetched successfully",
      data: users,
    });
  } catch (error) {
    console.log(error, "ERROR");
    next(error);
  }
};
