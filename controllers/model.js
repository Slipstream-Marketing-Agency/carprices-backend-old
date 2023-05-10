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
        // year,
        // isLuxury,
        // isPremiumLuxury,
        // isSafety,
        // isFuelEfficient,
        // isOffRoad,
        // haveMusic,
        // haveTechnology,
        // havePerformance,
        // isSpacious,
        isElectric,
        published
    } = req.body.model;

    fieldValidation(name, next);
    fieldValidation(brand, next);
    // fieldValidation(year, next);
    fieldValidation(isElectric, next);

    let slug;

    if (typeof name == 'number') {
        slug = name
    } else {
        slug = slugify(name, {
            lower: true
        });
    }

    const model = await Model.create({
        name,
        metaTitle,
        description,
        brand,
        year: 2023,
        // isLuxury,
        // isPremiumLuxury,
        // isSafety,
        // isFuelEfficient,
        // isOffRoad,
        // haveMusic,
        // haveTechnology,
        // havePerformance,
        // isSpacious,
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
        order: orderBy,
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
                model.mainTrim = await Trim.findByPk(model.highTrim, { raw: true });
                model.mainTrim.images = await TrimImages.findAll({
                    where: {
                        trimId: model.mainTrim.id
                    }
                })
                model.mainTrim.videos = await TrimVideos.findAll({
                    where: {
                        trimId: model.mainTrim.id
                    }
                })
            } else {
                model.mainTrim = await Trim.findOne({
                    where: {
                        model: model.id
                    },
                    raw: true
                });
                if (model.mainTrim) {
                    model.mainTrim.images = await TrimImages.findAll({
                        where: {
                            trimId: model.mainTrim?.id
                        }
                    })
                    model.mainTrim.videos = await TrimVideos.findAll({
                        where: {
                            trimId: model.mainTrim?.id
                        }
                    })
                }

            }

            return model;
        })
    )

    res
        .status(200)
        .json({ models: models.rows, modelsCount: models.count, totalPage: Math.ceil(models.count / pageSize) });
});

module.exports.searchModels = asyncHandler(async (req, res, next) => {

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
        attributes: ["id", "name", "slug"],
        raw: true,
        where
    };
    if (!isAll) {
        conditions = {
            attributes: ["id", "name", "slug"],
            where,
            limit: pageSize,
            offset: (currentPage - 1) * pageSize,
            order: orderBy,
            raw: true
        }
    }

    let models = { rows: [], count: 0 };

    models = await Model.findAndCountAll(conditions);

    // models.rows = await Promise.all(
    //     models.rows.map(async model => {
    //         model.brand = await CarBrand.findByPk(model.brand);


    //         return model;
    //     })
    // )

    res
        .status(200)
        .json({ models: models.rows, modelsCount: models.count, totalPage: Math.ceil(models.count / pageSize) });
});

module.exports.getModelsByBrandMin = asyncHandler(async (req, res, next) => {

    const { brand } = req.params;

    const { query } = req;

    let isAll = query.isAll ?? false;

    let pageSize = query.pageSize ?? 10;
    let currentPage = query.currentPage ?? 1;
    let orderBy = query.orderBy ? [
        [query.orderBy, "ASC"]
    ] : null;
    let where = {
        brand,
        published: true
    };
    if (query.search) {
        where.name = { [Op.iLike]: `%${query.search}%` }
    }

    let conditions = {
        attributes: ["id", "name", "slug"],
        raw: true,
        where
    };
    if (!isAll) {
        conditions = {
            attributes: ["id", "name", "slug"],
            where,
            limit: pageSize,
            offset: (currentPage - 1) * pageSize,
            order: orderBy,
            raw: true
        }
    }

    let models = { rows: [], count: 0 };

    models = await Model.findAndCountAll(conditions);

    res
        .status(200)
        .json({ models: models.rows, modelsCount: models.count, totalPage: Math.ceil(models.count / pageSize) });
});

module.exports.getModelsByBrand = asyncHandler(async (req, res, next) => {

    const { brand } = req.params;

    const { query } = req;

    let isAll = query.isAll ?? false;

    let pageSize = query.pageSize ?? 10;
    let currentPage = query.currentPage ?? 1;
    let orderBy = query.orderBy ? [
        [query.orderBy, "ASC"]
    ] : null;
    let where = {
        brand,
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

module.exports.getModelsByBrandSlug = asyncHandler(async (req, res, next) => {

    const { brand } = req.params;

    const brandData = await CarBrand.findOne({
        where: {
            slug: brand
        }
    })

    if (!brandData) {
        return res.status(404).json({ message: "Brand not found!" })
    }

    const { query } = req;

    let isAll = query.isAll ?? false;

    let pageSize = query.pageSize ?? 10;
    let currentPage = query.currentPage ?? 1;
    let orderBy = query.orderBy ? [
        [query.orderBy, "ASC"]
    ] : null;
    let where = {
        brand: brandData.id,
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

module.exports.getModelsByBrandAndYear = asyncHandler(async (req, res, next) => {

    const { brand, year } = req.params;

    const { query } = req;

    let isAll = query.isAll ?? false;

    let pageSize = query.pageSize ?? 10;
    let currentPage = query.currentPage ?? 1;
    let orderBy = query.orderBy ? [
        [query.orderBy, "ASC"]
    ] : null;
    let where = {
        brand,
        year,
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

module.exports.getModelsByBrandAndYearSlug = asyncHandler(async (req, res, next) => {

    const { brand, year } = req.params;

    const brandData = await CarBrand.findOne({
        where: {
            slug: brand
        }
    })

    if (!brandData) {
        return res.status(404).json({ message: "Brand not found!" })
    }

    const { query } = req;

    let isAll = query.isAll ?? false;

    let pageSize = query.pageSize ?? 10;
    let currentPage = query.currentPage ?? 1;
    let orderBy = query.orderBy ? [
        [query.orderBy, "ASC"]
    ] : null;
    let where = {
        brand: brandData.id,
        // year,
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

            if (model.mainTrim) {
                model.mainTrim = await Trim.findOne({
                    where: {
                        model: model.id,
                        year
                    }
                });
            }


            return model;
        })
    )

    models.rows = models.rows.filter(model => model.mainTrim != null);
    models.count = models.rows.length;

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
            model.minPrice = await Trim.min("price", {
                where: {
                    model: model.id
                }
            });

            model.maxPrice = await Trim.max("price", {
                where: {
                    model: model.id
                }
            });
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
            model.minPrice = await Trim.min("price", {
                where: {
                    model: model.id
                }
            });

            model.maxPrice = await Trim.max("price", {
                where: {
                    model: model.id
                }
            });
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
        id: [111, 166, 231, 251],
        published: true,
        isElectric: true
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
            model.minPrice = await Trim.min("price", {
                where: {
                    model: model.id
                }
            });

            model.maxPrice = await Trim.max("price", {
                where: {
                    model: model.id
                }
            });
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

module.exports.getSpecificModels = asyncHandler(async (req, res, next) => {

    const { id } = req.body;

    let where = {
        id: id,
        published: true
    };

    // [268, 228, 126, 244]

    let conditions = {
        raw: true,
        where
    };

    let models = await Model.findAll(conditions);

    models = await Promise.all(
        models.map(async model => {
            model.brand = await CarBrand.findByPk(model.brand);
            model.minPrice = await Trim.min("price", {
                where: {
                    model: model.id
                }
            });

            model.maxPrice = await Trim.max("price", {
                where: {
                    model: model.id
                }
            });
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
        .json({ models });
});

module.exports.getModelsBySlug = asyncHandler(async (req, res, next) => {

    const { model: slug } = req.params;

    let where = {
        slug,
    };

    const model = await Model.findOne({ where, raw: true });

    if (!model) {
        return res.status(404).json({
            message: "Model not found"
        })
    }

    model.brand = await CarBrand.findByPk(model.brand);
    if (model.highTrim) {
        model.mainTrim = await Trim.findByPk(model.highTrim, { raw: true });
        model.mainTrim.images = await TrimImages.findAll({
            where: {
                trimId: model.mainTrim.id
            }
        })
        model.mainTrim.videos = await TrimVideos.findAll({
            where: {
                trimId: model.mainTrim.id
            }
        })
    } else {
        model.mainTrim = await Trim.findOne({
            where: {
                model: model.id
            },
            raw: true
        });
        if (model.mainTrim) {
            model.mainTrim.images = await TrimImages.findAll({
                where: {
                    trimId: model.mainTrim?.id
                }
            })
            model.mainTrim.videos = await TrimVideos.findAll({
                where: {
                    trimId: model.mainTrim?.id
                }
            })
        }

    }

    model.trims = await Trim.findAll({
        where: {
            model: model.id,
            year: model.mainTrim.year
        },
        raw: true
    });

    model.minPower = await Trim.min("power", {
        where: {
            model: model.id,
            year: model.mainTrim.year
        },

    });

    model.maxPower = await Trim.max("power", {
        where: {
            model: model.id,
            year: model.mainTrim.year
        },

    });

    model.minPower = await Trim.min("power", {
        where: {
            model: model.id,
            year: model.mainTrim.year
        },

    });

    model.maxPower = await Trim.max("power", {
        where: {
            model: model.id,
            year: model.mainTrim.year
        },

    });

    model.minTorque = await Trim.min("torque", {
        where: {
            model: model.id,
            year: model.mainTrim.year
        },
    });

    model.maxTorque = await Trim.max("torque", {
        where: {
            model: model.id,
            year: model.mainTrim.year
        },
    });

    model.minPrice = await Trim.min("price", {
        where: {
            model: model.id,
            year: model.mainTrim.year
        },
    });

    model.maxPrice = await Trim.max("price", {
        where: {
            model: model.id,
            year: model.mainTrim.year
        },
    });

    model.minfuelConsumption = await Trim.min("fuelConsumption", {
        where: {
            model: model.id,
            year: model.mainTrim.year
        },
    });

    model.maxfuelConsumption = await Trim.max("fuelConsumption", {
        where: {
            model: model.id,
            year: model.mainTrim.year
        },
    });

    model.engines = await Trim.findAll({
        attributes: ['engine'],
        group: ['engine'],
        where: {
            model: model.id,
            year: model.mainTrim.year
        },
    })

    model.engines = model.engines.map(engine => engine.engine);

    model.trims = await Promise.all(
        model.trims.map(async trim => {
            trim.images = await TrimImages.findAll({
                where: {
                    trimId: trim?.id
                }
            })
            trim.videos = await TrimVideos.findAll({
                where: {
                    trimId: trim?.id
                }
            })
            return trim;
        })
    )



    model.allYearMainTrims = await Trim.findAll({
        attributes: ["id", "name", "year", "featuredImage", "slug"],
        where: {
            model: model.id,
            slug: model.mainTrim.slug
        }
    });


    res
        .status(200)
        .json({ model });
});

module.exports.getModelsBySlugBrand = asyncHandler(async (req, res, next) => {

    const { model: slug, brand: brandSlug } = req.params;

    const brand = await CarBrand.findOne({ where: { slug: brandSlug }, raw: true });

    let where = {
        slug,
        brand: brand.id
    };

    const model = await Model.findOne({ where, raw: true });

    if (!model) {
        return res.status(404).json({
            message: "Model not found"
        })
    }

    model.brand = await CarBrand.findByPk(model.brand);
    if (model.highTrim) {
        model.mainTrim = await Trim.findByPk(model.highTrim, { raw: true });
        model.mainTrim.images = await TrimImages.findAll({
            where: {
                trimId: model.mainTrim.id
            }
        })
        model.mainTrim.videos = await TrimVideos.findAll({
            where: {
                trimId: model.mainTrim.id
            }
        })
    } else {
        model.mainTrim = await Trim.findOne({
            where: {
                model: model.id
            },
            raw: true
        });
        if (model.mainTrim) {
            model.mainTrim.images = await TrimImages.findAll({
                where: {
                    trimId: model.mainTrim?.id
                }
            })
            model.mainTrim.videos = await TrimVideos.findAll({
                where: {
                    trimId: model.mainTrim?.id
                }
            })
        }

    }

    model.trims = await Trim.findAll({
        where: {
            model: model.id,
            year: model.mainTrim.year
        },
        raw: true
    });

    model.minPower = await Trim.min("power", {
        where: {
            model: model.id,
            year: model.mainTrim.year
        },

    });

    model.maxPower = await Trim.max("power", {
        where: {
            model: model.id,
            year: model.mainTrim.year
        },

    });

    model.minPower = await Trim.min("power", {
        where: {
            model: model.id,
            year: model.mainTrim.year
        },

    });

    model.maxPower = await Trim.max("power", {
        where: {
            model: model.id,
            year: model.mainTrim.year
        },

    });

    model.minTorque = await Trim.min("torque", {
        where: {
            model: model.id,
            year: model.mainTrim.year
        },
    });

    model.maxTorque = await Trim.max("torque", {
        where: {
            model: model.id,
            year: model.mainTrim.year
        },
    });

    model.minPrice = await Trim.min("price", {
        where: {
            model: model.id,
            year: model.mainTrim.year
        },
    });

    model.maxPrice = await Trim.max("price", {
        where: {
            model: model.id,
            year: model.mainTrim.year
        },
    });

    model.minfuelConsumption = await Trim.min("fuelConsumption", {
        where: {
            model: model.id,
            year: model.mainTrim.year
        },
    });

    model.maxfuelConsumption = await Trim.max("fuelConsumption", {
        where: {
            model: model.id,
            year: model.mainTrim.year
        },
    });

    model.engines = await Trim.findAll({
        attributes: ['engine'],
        group: ['engine'],
        where: {
            model: model.id,
            year: model.mainTrim.year
        },
    })

    model.engines = model.engines.map(engine => engine.engine);

    model.trims = await Promise.all(
        model.trims.map(async trim => {
            trim.images = await TrimImages.findAll({
                where: {
                    trimId: trim?.id
                }
            })
            trim.videos = await TrimVideos.findAll({
                where: {
                    trimId: trim?.id
                }
            })
            return trim;
        })
    )



    model.allYearMainTrims = await Trim.findAll({
        attributes: ["id", "name", "year", "featuredImage", "slug"],
        where: {
            model: model.id,
            slug: model.mainTrim.slug
        }
    });


    res
        .status(200)
        .json({ model });
});

module.exports.getModelsBySlugBrandAndYear = asyncHandler(async (req, res, next) => {

    const { model: slug, brand: brandSlug, year } = req.params;

    const brand = await CarBrand.findOne({ where: { slug: brandSlug }, raw: true });

    let where = {
        slug,
        brand: brand.id
    };

    const model = await Model.findOne({ where, raw: true });

    if (!model) {
        return res.status(404).json({
            message: "Model not found"
        })
    }

    model.brand = await CarBrand.findByPk(model.brand);

    model.mainTrim = await Trim.findOne({
        where: {
            model: model.id,
            year
        },
        raw: true
    });
    if (model.mainTrim) {
        model.mainTrim.images = await TrimImages.findAll({
            where: {
                trimId: model.mainTrim?.id
            }
        })
        model.mainTrim.videos = await TrimVideos.findAll({
            where: {
                trimId: model.mainTrim?.id
            }
        })
    }else{
            return res.status(404).json({
                message: "Trim not found"
            })
    }



    model.trims = await Trim.findAll({
        where: {
            model: model.id,
            year: model.mainTrim.year
        },
        raw: true
    });

    model.minPower = await Trim.min("power", {
        where: {
            model: model.id,
            year: model.mainTrim.year
        },

    });

    model.maxPower = await Trim.max("power", {
        where: {
            model: model.id,
            year: model.mainTrim.year
        },

    });

    model.minPower = await Trim.min("power", {
        where: {
            model: model.id,
            year: model.mainTrim.year
        },

    });

    model.maxPower = await Trim.max("power", {
        where: {
            model: model.id,
            year: model.mainTrim.year
        },

    });

    model.minTorque = await Trim.min("torque", {
        where: {
            model: model.id,
            year: model.mainTrim.year
        },
    });

    model.maxTorque = await Trim.max("torque", {
        where: {
            model: model.id,
            year: model.mainTrim.year
        },
    });

    model.minfuelConsumption = await Trim.min("fuelConsumption", {
        where: {
            model: model.id,
            year: model.mainTrim.year
        },
    });

    model.maxfuelConsumption = await Trim.max("fuelConsumption", {
        where: {
            model: model.id,
            year: model.mainTrim.year
        },
    });

    model.engines = await Trim.findAll({
        attributes: ['engine'],
        group: ['engine'],
        where: {
            model: model.id,
            year: model.mainTrim.year
        },
    })

    model.engines = model.engines.map(engine => engine.engine);

    model.trims = await Promise.all(
        model.trims.map(async trim => {
            trim.images = await TrimImages.findAll({
                where: {
                    trimId: trim?.id
                }
            })
            trim.videos = await TrimVideos.findAll({
                where: {
                    trimId: trim?.id
                }
            })
            return trim;
        })
    )



    model.allYearMainTrims = await Trim.findAll({
        attributes: ["id", "name", "year", "featuredImage", "slug"],
        where: {
            model: model.id,
            slug: model.mainTrim.slug
        }
    });


    res
        .status(200)
        .json({ model });
});

module.exports.topMostSearchedCars = asyncHandler(async (req, res, next) => {

    let pageSize = 8;
    let currentPage = 1;
    let where = {
        published: true,
        id: [1, 2, 4, 6, 7, 8, 10, 12]
    };

    let conditions = {
        where,
        limit: pageSize,
        offset: (currentPage - 1) * pageSize,
        // order: orderBy,
        raw: true
    }

    let models = { rows: [], count: 0 };

    models = await Model.findAndCountAll(conditions);

    models.rows = await Promise.all(
        models.rows.map(async model => {
            model.brand = await CarBrand.findByPk(model.brand);
            model.minPrice = await Trim.min("price", {
                where: {
                    model: model.id
                }
            });

            model.maxPrice = await Trim.max("price", {
                where: {
                    model: model.id
                }
            });
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
        .json({ models: models.rows, });
});

module.exports.compareCarModels = asyncHandler(async (req, res, next) => {

    const compareListIds = [{ v1: 1, v2: 2 }, { v1: 3, v2: 4 }, { v1: 5, v2: 6 }]

    let models = []

    await Promise.all(
        compareListIds.map(async items => {
            let v1 = await Model.findOne({
                where: {
                    id: items.v1
                },
                raw: true
            })
            if (v1) {
                v1.brand = await CarBrand.findByPk(v1.brand);
                v1.minPrice = await Trim.min("price", {
                    where: {
                        model: v1.id
                    }
                });

                v1.maxPrice = await Trim.max("price", {
                    where: {
                        model: v1.id
                    }
                });
                if (v1.highTrim) {
                    v1.mainTrim = await Trim.findByPk(v1.highTrim);
                } else {
                    v1.mainTrim = await Trim.findOne({
                        where: {
                            model: v1.id
                        }
                    });

                }
            }

            let v2 = await Model.findOne({
                where: {
                    id: items.v2
                },
                raw: true
            })
            if (v2) {
                v2.brand = await CarBrand.findByPk(v2.brand);
                v2.minPrice = await Trim.min("price", {
                    where: {
                        model: v2.id
                    }
                });

                v2.maxPrice = await Trim.max("price", {
                    where: {
                        model: v2.id
                    }
                });
                if (v2.highTrim) {
                    v2.mainTrim = await Trim.findByPk(v2.highTrim);
                } else {
                    v2.mainTrim = await Trim.findOne({
                        where: {
                            model: v2.id
                        }
                    });

                }
            }


            models.push({ v1, v2 })
        })
    )

    res
        .status(200)
        .json({ models: models, });
});

const fieldValidation = (field, next) => {
    if (!field) {
        return new ErrorResponse(`Missing fields`, 400);
    }
};
