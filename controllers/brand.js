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
    } = req.body.brand;

    fieldValidation(name, next);
    fieldValidation(image, next);

    const slug = slugify(name, {
        lower: true
    });

    const brand = await CarBrand.create({
        name,
        image,
        slug
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

    let conditions = {};
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





const fieldValidation = (field, next) => {
    if (!field) {
        return next(new ErrorResponse(`Missing fields`, 400));
    }
};
