const { where, Op } = require("sequelize");
const asyncHandler = require("../middlewares/asyncHandler");
const ErrorResponse = require("../util/errorResponse");
const slugify = require("slugify");

const redisClient = require("../util/caching");
const CarBrand = require("../models/CarBrand");
const moment = require("moment");
const Model = require("../models/Model");
const Trim = require("../models/Trim");
const TrimVideos = require("../models/TrimVideo");
const TrimImages = require("../models/TrimImages");

module.exports.createModel = asyncHandler(async (req, res, next) => {
    const {
        name,
        metaTitle,
        description,
        brand,
        year,
        isLuxury,
        isPremiumLuxury,
        isSafety,
        isFuelEfficient,
        isOffRoad,
        haveMusic,
        haveTechnology,
        havePerformance,
        isSpacious,
        isElectric,
        published
    } = req.body.model;

    fieldValidation(name, next);
    fieldValidation(brand, next);
    fieldValidation(year, next);
    fieldValidation(isElectric, next);

    const slug = slugify(name, {
        lower: true
    });

    const model = await Model.create({
        name,
        metaTitle,
        description,
        brand,
        year,
        isLuxury,
        isPremiumLuxury,
        isSafety,
        isFuelEfficient,
        isOffRoad,
        haveMusic,
        haveTechnology,
        havePerformance,
        isSpacious,
        isElectric,
        published,
        slug
    });

    await redisClient.del("models");

    res.status(201).json({ model });
});

module.exports.getAdminModels = asyncHandler(async (req, res, next) => {

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

    let models = { rows: [], count: 0 };

    models = await Model.findAndCountAll(conditions);

    models.rows = await Promise.all(
        models.rows.map(async model => {
            model.brand = await CarBrand.findByPk(model.brand);
            return model;
        })
    )

    res
        .status(200)
        .json({ models: models.rows, modelsCount: models.count, totalPage: Math.ceil(models.count / pageSize) });
});

module.exports.updateModel = asyncHandler(async (req, res, next) => {

    const { model } = req.params;
    const {
        name,
        metaTitle,
        description,
        brand,
        year,
        isLuxury,
        isPremiumLuxury,
        isSafety,
        isFuelEfficient,
        isOffRoad,
        haveMusic,
        haveTechnology,
        havePerformance,
        isSpacious,
        isElectric,
        published
    } = req.body.model;

    fieldValidation(name, next);
    fieldValidation(brand, next);
    fieldValidation(year, next);
    fieldValidation(isElectric, next);

    const slug = slugify(name, {
        lower: true
    });

    await Model.update({
        name,
        metaTitle,
        description,
        brand,
        year,
        isLuxury,
        isPremiumLuxury,
        isSafety,
        isFuelEfficient,
        isOffRoad,
        haveMusic,
        haveTechnology,
        havePerformance,
        isSpacious,
        isElectric,
        published,
        slug
    }, {
        where: {
            id: model
        }
    });

    await redisClient.del("models");

    res.status(201).json({ message: "Model Updated" });
});

module.exports.setHighTrim = asyncHandler(async (req, res, next) => {

    const {
        trimId: id
    } = req.body.model;

    fieldValidation(id, next);

    const trim = await Trim.findByPk(id);

    if (!trim) {
        return res.status(404).json({ message: "Trim not found" })
    }

    await Model.update({
        highTrim: trim.id,
        featuredImage: trim.featuredImage
    }, {
        where: {
            id: trim.model
        }
    });

    await redisClient.del("models");

    res.status(201).json({ message: "Main Trim Updated" });
});

module.exports.getModels = asyncHandler(async (req, res, next) => {

    const { query } = req;

    let isAll = query.isAll ?? false;

    let pageSize = query.pageSize ?? 10;
    let currentPage = query.currentPage ?? 1;
    let orderBy = query.orderBy ? [
        [query.orderBy, "ASC"]
    ] : null;
    let where = {
        published: true
    };
    if (query.search) {
        where.name = { [Op.iLike]: `%${query.search}%` }
    }

    let conditions = {
        raw: true,
        where
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

    let models = { rows: [], count: 0 };

    models = await Model.findAndCountAll(conditions);

    models.rows = await Promise.all(
        models.rows.map(async model => {
            model.brand = await CarBrand.findByPk(model.brand);
            if (model.highTrim) {
                model.mainTrim = await Trim.findByPk(model.highTrim);
                // model.mainTrim.images = await TrimImages.findAll({
                //     where: {
                //         trimId: model.mainTrim.id
                //     }
                // })
                // model.mainTrim.videos = await TrimVideos.findAll({
                //     where: {
                //         trimId: model.mainTrim.id
                //     }
                // })
            } else {
                model.mainTrim = await Trim.findOne({
                    where: {
                        model: model.id
                    }
                });
                // if (model.mainTrim) {
                //     model.mainTrim.images = await TrimImages.findAll({
                //         where: {
                //             trimId: model.mainTrim?.id
                //         }
                //     })
                //     model.mainTrim.videos = await TrimVideos.findAll({
                //         where: {
                //             trimId: model.mainTrim?.id
                //         }
                //     })
                // }

            }

            return model;
        })
    )

    res
        .status(200)
        .json({ models: models.rows, modelsCount: models.count, totalPage: Math.ceil(models.count / pageSize) });
});

module.exports.setFeaturedModels = asyncHandler(async (req, res, next) => {

    const {
        ids
    } = req.body.models;

    fieldValidation(ids, next);

    await Model.update({
        isFeatured: true
    }, {
        where: {
            id: ids
        }
    }
    );

    res
        .status(200)
        .json({ message: "Featured List Updated" });
});

module.exports.removeFeaturedModels = asyncHandler(async (req, res, next) => {

    const {
        ids
    } = req.body.models;

    fieldValidation(ids, next);

    await Model.update({
        isFeatured: false
    }, {
        where: {
            id: ids
        }
    }
    );

    res
        .status(200)
        .json({ message: "Featured List Updated" });
});

module.exports.getAdminFeaturedModels = asyncHandler(async (req, res, next) => {

    const { query } = req;

    let isAll = query.isAll ?? false;

    let pageSize = query.pageSize ?? 10;
    let currentPage = query.currentPage ?? 1;
    let orderBy = query.orderBy ? [
        [query.orderBy, "ASC"]
    ] : null;
    let where = {
        isFeatured: true
    };
    if (query.search) {
        where.name = { [Op.iLike]: `%${query.search}%` }
    }

    let conditions = {
        raw: true,
        where
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

    let models = { rows: [], count: 0 };

    models = await Model.findAndCountAll(conditions);

    models.rows = await Promise.all(
        models.rows.map(async model => {
            model.brand = await CarBrand.findByPk(model.brand);
            if (model.highTrim) {
                model.mainTrim = await Trim.findByPk(model.highTrim);
                // model.mainTrim.images = await TrimImages.findAll({
                //     where: {
                //         trimId: model.mainTrim.id
                //     }
                // })
                // model.mainTrim.videos = await TrimVideos.findAll({
                //     where: {
                //         trimId: model.mainTrim.id
                //     }
                // })
            } else {
                model.mainTrim = await Trim.findOne({
                    where: {
                        model: model.id
                    }
                });
                // if (model.mainTrim) {
                //     model.mainTrim.images = await TrimImages.findAll({
                //         where: {
                //             trimId: model.mainTrim?.id
                //         }
                //     })
                //     model.mainTrim.videos = await TrimVideos.findAll({
                //         where: {
                //             trimId: model.mainTrim?.id
                //         }
                //     })
                // }

            }

            return model;
        })
    )

    res
        .status(200)
        .json({ models: models.rows, modelsCount: models.count, totalPage: Math.ceil(models.count / pageSize) });
});

module.exports.getFeaturedModels = asyncHandler(async (req, res, next) => {

    const { query } = req;

    let isAll = query.isAll ?? false;

    let pageSize = query.pageSize ?? 10;
    let currentPage = query.currentPage ?? 1;
    let orderBy = query.orderBy ? [
        [query.orderBy, "ASC"]
    ] : null;
    let where = {
        published: true,
        isFeatured: true
    };
    if (query.search) {
        where.name = { [Op.iLike]: `%${query.search}%` }
    }

    let conditions = {
        raw: true,
        where
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

    let models = { rows: [], count: 0 };

    models = await Model.findAndCountAll(conditions);

    models.rows = await Promise.all(
        models.rows.map(async model => {
            model.brand = await CarBrand.findByPk(model.brand);
            if (model.highTrim) {
                model.mainTrim = await Trim.findByPk(model.highTrim);
                // model.mainTrim.images = await TrimImages.findAll({
                //     where: {
                //         trimId: model.mainTrim.id
                //     }
                // })
                // model.mainTrim.videos = await TrimVideos.findAll({
                //     where: {
                //         trimId: model.mainTrim.id
                //     }
                // })
            } else {
                model.mainTrim = await Trim.findOne({
                    where: {
                        model: model.id
                    }
                });
                // if (model.mainTrim) {
                //     model.mainTrim.images = await TrimImages.findAll({
                //         where: {
                //             trimId: model.mainTrim?.id
                //         }
                //     })
                //     model.mainTrim.videos = await TrimVideos.findAll({
                //         where: {
                //             trimId: model.mainTrim?.id
                //         }
                //     })
                // }

            }

            return model;
        })
    )

    res
        .status(200)
        .json({ models: models.rows, modelsCount: models.count, totalPage: Math.ceil(models.count / pageSize) });
});

module.exports.setElectricFeaturedModels = asyncHandler(async (req, res, next) => {

    const {
        ids
    } = req.body.models;

    fieldValidation(ids, next);

    await Model.update({
        isElectricFeatured: true
    }, {
        where: {
            id: ids
        }
    }
    );

    res
        .status(200)
        .json({ message: "Featured List Updated" });
});

module.exports.removeElectricFeaturedModels = asyncHandler(async (req, res, next) => {

    const {
        ids
    } = req.body.models;

    fieldValidation(ids, next);

    await Model.update({
        isElectricFeatured: false
    }, {
        where: {
            id: ids
        }
    }
    );

    res
        .status(200)
        .json({ message: "Featured List Updated" });
});

module.exports.getAdminElectricFeaturedModels = asyncHandler(async (req, res, next) => {

    const { query } = req;

    let isAll = query.isAll ?? false;

    let pageSize = query.pageSize ?? 10;
    let currentPage = query.currentPage ?? 1;
    let orderBy = query.orderBy ? [
        [query.orderBy, "ASC"]
    ] : null;
    let where = {
        isElectricFeatured: true
    };
    if (query.search) {
        where.name = { [Op.iLike]: `%${query.search}%` }
    }

    let conditions = {
        raw: true,
        where
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

    let models = { rows: [], count: 0 };

    models = await Model.findAndCountAll(conditions);

    models.rows = await Promise.all(
        models.rows.map(async model => {
            model.brand = await CarBrand.findByPk(model.brand);
            if (model.highTrim) {
                model.mainTrim = await Trim.findByPk(model.highTrim);
                // model.mainTrim.images = await TrimImages.findAll({
                //     where: {
                //         trimId: model.mainTrim.id
                //     }
                // })
                // model.mainTrim.videos = await TrimVideos.findAll({
                //     where: {
                //         trimId: model.mainTrim.id
                //     }
                // })
            } else {
                model.mainTrim = await Trim.findOne({
                    where: {
                        model: model.id
                    }
                });
                // if (model.mainTrim) {
                //     model.mainTrim.images = await TrimImages.findAll({
                //         where: {
                //             trimId: model.mainTrim?.id
                //         }
                //     })
                //     model.mainTrim.videos = await TrimVideos.findAll({
                //         where: {
                //             trimId: model.mainTrim?.id
                //         }
                //     })
                // }

            }

            return model;
        })
    )

    res
        .status(200)
        .json({ models: models.rows, modelsCount: models.count, totalPage: Math.ceil(models.count / pageSize) });
});

module.exports.getElectricFeaturedModels = asyncHandler(async (req, res, next) => {

    const { query } = req;

    let isAll = query.isAll ?? false;

    let pageSize = query.pageSize ?? 10;
    let currentPage = query.currentPage ?? 1;
    let orderBy = query.orderBy ? [
        [query.orderBy, "ASC"]
    ] : null;
    let where = {
        published: true,
        isElectricFeatured: true
    };
    if (query.search) {
        where.name = { [Op.iLike]: `%${query.search}%` }
    }

    let conditions = {
        raw: true,
        where
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

    let models = { rows: [], count: 0 };

    models = await Model.findAndCountAll(conditions);

    models.rows = await Promise.all(
        models.rows.map(async model => {
            model.brand = await CarBrand.findByPk(model.brand);
            if (model.highTrim) {
                model.mainTrim = await Trim.findByPk(model.highTrim);
                // model.mainTrim.images = await TrimImages.findAll({
                //     where: {
                //         trimId: model.mainTrim.id
                //     }
                // })
                // model.mainTrim.videos = await TrimVideos.findAll({
                //     where: {
                //         trimId: model.mainTrim.id
                //     }
                // })
            } else {
                model.mainTrim = await Trim.findOne({
                    where: {
                        model: model.id
                    }
                });
                // if (model.mainTrim) {
                //     model.mainTrim.images = await TrimImages.findAll({
                //         where: {
                //             trimId: model.mainTrim?.id
                //         }
                //     })
                //     model.mainTrim.videos = await TrimVideos.findAll({
                //         where: {
                //             trimId: model.mainTrim?.id
                //         }
                //     })
                // }

            }

            return model;
        })
    )

    res
        .status(200)
        .json({ models: models.rows, modelsCount: models.count, totalPage: Math.ceil(models.count / pageSize) });
});

const fieldValidation = (field, next) => {
    if (!field) {
        return new ErrorResponse(`Missing fields`, 400);
    }
};
