const { where, Op } = require("sequelize");
const asyncHandler = require("../middlewares/asyncHandler");
const ErrorResponse = require("../util/errorResponse");
const slugify = require("slugify");

const redisClient = require("../util/caching");
const CarBrand = require("../models/CarBrand");
const moment = require("moment");

module.exports.createBrand = asyncHandler(async (req, res, next) => {
    const {
        name,
        image,
        coverImage,
        description,
    } = req.body.brand;

    fieldValidation(name, next);
    fieldValidation(image, next);

    const slug = slugify(name, {
        lower: true
    });

    const brand = await CarBrand.create({
        name,
        image,
        slug,
        coverImage,
        description
    }).catch( err => {
        console.log("error ", err);
    });

    await redisClient.del("brands");

    res.status(201).json({ brand });
});

module.exports.getAdminBrands = asyncHandler(async (req, res, next) => {

    const { query } = req;

    let isAll = query.isAll ?? false;

    let pageSize = query.pageSize ?? 10;
    let currentPage = query.currentPage ?? 1;
    let orderBy = query.orderBy ? [
        [query.orderBy, "ASC"]
    ] : null;
    let where = {};
    if (query.search) {
        where.name = { [Op.iLike]: `%${query.search}%` }
    }

    let conditions = {
        order: orderBy
    };
    if (!isAll) {
        conditions = {
            where,
            limit: pageSize,
            offset: (currentPage - 1) * pageSize,
            order: orderBy
        }
    }

    let brands = { rows: [], count: 0 };

    brands = await CarBrand.findAndCountAll(conditions);

    res
        .status(200)
        .json({ brands: brands.rows, brandsCount: brands.count, totalPage: Math.ceil(brands.count / pageSize) });
});

module.exports.getAdminBrandById = asyncHandler(async (req, res, next) => {

    const { id } = req.params;

    let brand = await CarBrand.findOne({
        where: {
            id
        }
    });

    res
        .status(200)
        .json({ brand });
});

module.exports.getCarBrandBySlug = asyncHandler(async (req, res, next) => {

    const { slug } = req.params;

    let brands = await CarBrand.findOne({
        where: {
            slug
        }
    });

    res
        .status(200)
        .json({ brands });
});

module.exports.updateBrand = asyncHandler(async (req, res, next) => {
    const { id } = req.params;

    const {
        name,
        image,
        slug,
        coverImage,
        description
    } = req.body.brand;

    fieldValidation(name, next);
    fieldValidation(image, next);
    fieldValidation(slug, next);

    // const slug = slugify(name, {
    //     lower: true
    // });

    const brand = await CarBrand.update({
        name,
        image,
        slug,
        coverImage,
        description
    }, {
        where: {
            id
        }
    }).catch( err => {
        console.log("error ", err);
    });

    await redisClient.del("brands");

    res.status(201).json({ brand });
});

module.exports.getPopularCarBrand = asyncHandler(async (req, res, next) => {

    let where = {
        id: [44, 24, 66, 61, 21, 32, 28, 59, 57, 50, 45, 64]
    };

    let brands = { rows: [], count: 0 };

    brands = await CarBrand.findAndCountAll({
        where
    });

    res
        .status(200)
        .json({ brands: brands.rows, brandsCount: brands.count });
});

const fieldValidation = (field, next) => {
    if (!field) {
        return next(new ErrorResponse(`Missing fields`, 400));
    }
};
