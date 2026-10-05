const Blog = require("../../models/Blog");
const User = require("../../models/User");
const Doctor = require("../../models/Doctor");
const { Op } = require("sequelize");

exports.GetBlogsForPatient = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.body;

    const offset = (page - 1) * Number(limit);

    const where = {
      isDeleted: false,
      [Op.or]: [
        { blogType: "patient" },
        { blogType: "all" },
      ],
    };

    if (search) {
      where[Op.and] = [
        {
          [Op.or]: [
            { title: { [Op.iLike]: `%${search}%` } },
            { description: { [Op.iLike]: `%${search}%` } },
          ],
        },
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

exports.GetBlogByIdForPatient = async (req, res, next) => {
  try {
    const { blogId } = req.body;

    const blog = await Blog.findByPk(blogId, {
      where: {
        isDeleted: false,
        [Op.or]: [
          { blogType: "patient" },
          { blogType: "all" },
        ],
      },
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
