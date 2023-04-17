const { where, Op } = require("sequelize");
const asyncHandler = require("../middlewares/asyncHandler");
const ErrorResponse = require("../util/errorResponse");
const slugify = require("slugify");

const redisClient = require("../util/caching");
const CarBrand = require("../models/CarBrand");
const BlogCategory = require("../models/BlogCategory");
const Blog = require("../models/Blog");
const Category = require("../models/Category");
const moment = require("moment");
const BlogBrand = require("../models/BlogBrand");
const BlogModel = require("../models/BlogModel");
const Tag = require("../models/Tag");
const BlogTag = require("../models/BlogTag");
const Model = require("../models/Model");

module.exports.createBlog = asyncHandler(async (req, res, next) => {
    const {
        title,
        metaTitle,
        summary,
        content,
        coverImage,
        published,
        brands,
        categories,
        models,
        tags
    } = req.body.blog;

    fieldValidation(title, next);
    fieldValidation(coverImage, next);
    fieldValidation(content, next);
    fieldValidation(published, next);

    const slug = slugify(title, {
        lower: true
    });

    let publishedAt = null

    if (published) {
        publishedAt = new Date()
    }

    try {
        const blog = await Blog.create({
            title,
            metaTitle,
            slug,
            summary,
            published,
            publishedAt,
            coverImage,
            content,
            author: req.loggedAdmin.id
        })

        let blogBrands = brands.map(brand => ({ blogId: blog.id, brandId: brand }));
        let blogCategories = categories.map(category => ({ blogId: blog.id, categoryId: category }));
        let blogModels = models.map(model => ({ blogId: blog.id, modelId: model }));
        let blogTags = [];

        await Promise.all(
            tags.map(async tag => {
                let tagSlug = slugify(tag, {
                    lower: true
                });

                const [row, created] = await Tag.findOrCreate({
                    where: {
                        title: tag
                    },
                    defaults: {
                        title: tag,
                        slug: tagSlug
                    }
                });

                blogTags.push({
                    blogId: blog.id,
                    tagId: row.id
                })
                return tag;
            })
        )


        await BlogBrand.bulkCreate(blogBrands);
        await BlogCategory.bulkCreate(blogCategories);
        await BlogModel.bulkCreate(blogModels);
        await BlogTag.bulkCreate(blogTags);

        await redisClient.del("blogs");

        return res.status(201).json({ blog });
    } catch (error) {
        console.log('Error', error.message);
        // new ErrorResponse(err.message);
        return res.status(403).json({ message: error.message })
    }




});

module.exports.getAdminBlogs = asyncHandler(async (req, res, next) => {

    const { query } = req;

    let isAll = query.isAll ?? false;

    let pageSize = query.pageSize ?? 10;
    let currentPage = query.currentPage ?? 1;
    let orderBy = query.orderBy ? [
        [query.orderBy, "ASC"]
    ] : null;
    let where = {};
    if (query.search) {
        where.title = { [Op.iLike]: `%${query.search}%` }
    }

    let conditions = {
        raw: true
    };
    if (!isAll) {
        conditions = {
            where,
            limit: pageSize,
            offset: (currentPage - 1) * pageSize,
            order: orderBy,
            raw: true
        }
    }

    let blogs = { rows: [], count: 0 };

    blogs = await Blog.findAndCountAll(conditions);

    blogs.rows = await Promise.all(
        blogs.rows.map(async blog => {
            blog.brands = await BlogBrand.findAll({
                where: {
                    blogId: blog.id
                },
                raw: true
            });
            blog.brands = await Promise.all(
                blog.brands.map(async brand=>{
                    brand = await CarBrand.findByPk(brand.brandId);
                    return brand;
                })
            )
            blog.categories = await BlogCategory.findAll({
                where: {
                    blogId: blog.id
                },
                raw: true
            });
            blog.categories = await Promise.all(
                blog.categories.map(async category=>{
                    category = await Category.findByPk(category.categoryId);
                    return category;
                })
            )
            blog.models = await BlogModel.findAll({
                where: {
                    blogId: blog.id
                },
                raw: true
            });
            blog.models = await Promise.all(
                blog.models.map(async model=>{
                    model = await Model.findByPk(model.modelId);
                    return model;
                })
            )
            blog.tags = await BlogTag.findAll({
                where: {
                    blogId: blog.id
                },
                raw: true
            });
            blog.tags = await Promise.all(
                blog.tags.map(async tag=>{
                    tag = await Tag.findByPk(tag.tagId);
                    return tag;
                })
            )
            return blog;
        })
    )
    

        res
            .status(200)
            .json({ blogs: blogs.rows, blogsCount: blogs.count, totalPage: Math.ceil(blogs.count / pageSize) });
});

module.exports.createBlogCategory = asyncHandler(async (req, res, next) => {
    const {
        title,
        metaTitle,
        content,
    } = req.body.cateogry;

    fieldValidation(title, next);
    // fieldValidation(metaTitle, next);
    // fieldValidation(content, next);

    const slug = slugify(title, {
        lower: true
    });

    const blogCategory = await Category.create({
        title,
        metaTitle,
        slug,
        content
    });

    await redisClient.del("blogCategory");

    res.status(201).json({ blogCategory });
});

module.exports.getAdminBlogCategory = asyncHandler(async (req, res, next) => {

    const { query } = req;

    let isAll = query.isAll ?? false;

    let pageSize = query.pageSize ?? 10;
    let currentPage = query.currentPage ?? 1;
    let orderBy = query.orderBy ? [
        [query.orderBy, "ASC"]
    ] : null;
    let where = {};
    if (query.search) {
        where.title = { [Op.iLike]: `%${query.search}%` }
    }

    let conditions = {};
    if (!isAll) {
        conditions = {
            where,
            limit: pageSize,
            offset: (currentPage - 1) * pageSize,
            order: orderBy
        }
    }

    let categories = { rows: [], count: 0 };

    categories = await Category.findAndCountAll(conditions);

    res
        .status(200)
        .json({ categories: categories.rows, categoriesCount: categories.count, totalPage: Math.ceil(categories.count / pageSize) });
});

module.exports.updateBlogCategory = asyncHandler(async (req, res, next) => {

    const { category } = req.params;
    const {
        title,
        metaTitle,
        content,
    } = req.body.cateogry;

    fieldValidation(title, next);
    // fieldValidation(metaTitle, next);
    // fieldValidation(content, next);

    const slug = slugify(title, {
        lower: true
    });

    await Category.update({
        title,
        metaTitle,
        slug,
        content
    }, {
        where: {
            id: category
        }
    });

    await redisClient.del("blogCategory");

    res.status(201).json({ message: "Category Updated" });
});

const fieldValidation = (field, next) => {
    if (!field) {
        return new ErrorResponse(`Missing fields`, 400);
    }
};
