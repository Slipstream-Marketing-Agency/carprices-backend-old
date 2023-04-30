const { where, Op, Sequelize } = require("sequelize");
const asyncHandler = require("../middlewares/asyncHandler");
const ErrorResponse = require("../util/errorResponse");
const slugify = require("slugify");

const redisClient = require("../util/caching");
const CarBrand = require("../models/CarBrand");
const moment = require("moment");
const Model = require("../models/Model");
const TrimImages = require("../models/TrimImages");
const Trim = require("../models/Trim");
const TrimVideos = require("../models/TrimVideo");

module.exports.createTrim = asyncHandler(async (req, res, next) => {
    const {
        name,
        metaTitle,
        description,
        brand,
        model,
        year,
        price,
        featuredImage,
        engine,
        displacement,
        torque,
        transmission,
        drive,
        fuelType,
        motor,
        motorType,
        batteryCapacity,
        chargingTime,
        batteryWarranty,
        range,
        zeroToHundred,
        topSpeed,
        fuelConsumption,
        cylinders,
        haveABS,
        haveFrontAirbags,
        haveSideAirbags,
        haveRearAirbags,
        haveFrontParkAssist,
        haveRearParkingCamera,
        have360ParkingCamera,
        haveCruiseControl,
        haveAdaptiveCuriseControl,
        haveLaneChangeAssist,
        bodyType,
        frontBrakes,
        haveRearBrakes,
        length,
        width,
        height,
        wheelbase,
        weight,
        fuelTankSize,
        tyresFront,
        tyresRear,
        cargoSpace,
        seatingCapacity,
        haveLeatherInterior,
        haveFabricInterior,
        haveAppleCarPlay,
        haveAndroidAuto,
        haveRearSeatEntertainment,
        haveCooledSeats,
        haveClimateControl,
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
        euroNcap,
        power,
        gearBox,
        haveRearParkAssist,
        airbags,
        doors,
        wheels,
        published,
        images,
        videos
    } = req.body.trim;

    fieldValidation(name, next);
    fieldValidation(brand, next);
    fieldValidation(model, next);
    fieldValidation(year, next);
    fieldValidation(isElectric, next);

    const slug = slugify(name, {
        lower: true
    });

    let brandData = await CarBrand.findOne({
        where: {
            id: brand
        }
    })

    let modelData = await Model.findOne({
        where: {
            id: model
        }
    })

    let mainSlug = `${year}-${brandData.slug}-${modelData.slug}-${slug}`

    const trim = await Trim.create({
        name,
        metaTitle,
        description,
        brand,
        model,
        year,
        price,
        featuredImage,
        engine,
        displacement,
        torque,
        transmission,
        drive,
        fuelType,
        motor,
        motorType,
        batteryCapacity,
        chargingTime,
        batteryWarranty,
        range,
        zeroToHundred,
        topSpeed,
        fuelConsumption,
        cylinders,
        haveABS,
        haveFrontAirbags,
        haveSideAirbags,
        haveRearAirbags,
        haveFrontParkAssist,
        haveRearParkingCamera,
        have360ParkingCamera,
        haveCruiseControl,
        haveAdaptiveCuriseControl,
        haveLaneChangeAssist,
        bodyType,
        frontBrakes,
        haveRearBrakes,
        length,
        width,
        height,
        wheelbase,
        weight,
        fuelTankSize,
        tyresFront,
        tyresRear,
        cargoSpace,
        seatingCapacity,
        haveLeatherInterior,
        haveFabricInterior,
        haveAppleCarPlay,
        haveAndroidAuto,
        haveRearSeatEntertainment,
        haveCooledSeats,
        haveClimateControl,
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
        euroNcap,
        published,
        slug,
        mainSlug,
        power,
        gearBox,
        haveRearParkAssist,
        airbags,
        doors,
        wheels,
    });

    const trimImages = images.map((image) => ({
        trimId: trim.id,
        image
    }))

    await TrimImages.bulkCreate(trimImages);

    const trimVideos = videos.map((video) => ({
        trimId: trim.id,
        video
    }))

    await TrimVideos.bulkCreate(trimVideos);

    await redisClient.del("trims");

    res.status(201).json({ trim });
});

module.exports.getAdminTrims = asyncHandler(async (req, res, next) => {

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

    let trims = { rows: [], count: 0 };

    trims = await Trim.findAndCountAll(conditions);

    trims.rows = await Promise.all(
        trims.rows.map(async trim => {
            trim.brand = await CarBrand.findByPk(trim.brand);
            trim.model = await Model.findByPk(trim.model, {
                attributes: ["id", "name"]
            });

            trim.images = await TrimImages.findAll({
                where: {
                    trimId: trim.id
                }
            })
            trim.videos = await TrimVideos.findAll({
                where: {
                    trimId: trim.id
                }
            })
            return trim;
        })
    )

    res
        .status(200)
        .json({ trims: trims.rows, trimsCount: trims.count, totalPage: Math.ceil(trims.count / pageSize) });
});

module.exports.updateTrim = asyncHandler(async (req, res, next) => {

    const { trim } = req.params;
    const {
        name,
        metaTitle,
        description,
        brand,
        model,
        year,
        price,
        featuredImage,
        engine,
        displacement,
        torque,
        transmission,
        drive,
        fuelType,
        motor,
        motorType,
        batteryCapacity,
        chargingTime,
        batteryWarranty,
        range,
        zeroToHundred,
        topSpeed,
        fuelConsumption,
        cylinders,
        haveABS,
        haveFrontAirbags,
        haveSideAirbags,
        haveRearAirbags,
        haveFrontParkAssist,
        haveRearParkingCamera,
        have360ParkingCamera,
        haveCruiseControl,
        haveAdaptiveCuriseControl,
        haveLaneChangeAssist,
        bodyType,
        frontBrakes,
        haveRearBrakes,
        length,
        width,
        height,
        wheelbase,
        weight,
        fuelTankSize,
        tyresFront,
        tyresRear,
        cargoSpace,
        seatingCapacity,
        haveLeatherInterior,
        haveFabricInterior,
        haveAppleCarPlay,
        haveAndroidAuto,
        haveRearSeatEntertainment,
        haveCooledSeats,
        haveClimateControl,
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
        euroNcap,
        power,
        gearBox,
        haveRearParkAssist,
        airbags,
        doors,
        wheels,
        slug,
        mainSlug,
        published,
        images,
        videos
    } = req.body.trim;

    fieldValidation(name, next);
    fieldValidation(brand, next);
    fieldValidation(year, next);
    fieldValidation(isElectric, next);

    await Trim.update({
        name,
        metaTitle,
        description,
        brand,
        model,
        year,
        price,
        featuredImage,
        engine,
        displacement,
        torque,
        transmission,
        drive,
        fuelType,
        motor,
        motorType,
        batteryCapacity,
        chargingTime,
        batteryWarranty,
        range,
        zeroToHundred,
        topSpeed,
        fuelConsumption,
        cylinders,
        haveABS,
        haveFrontAirbags,
        haveSideAirbags,
        haveRearAirbags,
        haveFrontParkAssist,
        haveRearParkingCamera,
        have360ParkingCamera,
        haveCruiseControl,
        haveAdaptiveCuriseControl,
        haveLaneChangeAssist,
        bodyType,
        frontBrakes,
        haveRearBrakes,
        length,
        width,
        height,
        wheelbase,
        weight,
        fuelTankSize,
        tyresFront,
        tyresRear,
        cargoSpace,
        seatingCapacity,
        haveLeatherInterior,
        haveFabricInterior,
        haveAppleCarPlay,
        haveAndroidAuto,
        haveRearSeatEntertainment,
        haveCooledSeats,
        haveClimateControl,
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
        euroNcap,
        published,
        power,
        gearBox,
        haveRearParkAssist,
        airbags,
        doors,
        wheels,
        slug,
        mainSlug,
    }, {
        where: {
            id: trim
        }
    });

    const trimImages = images.map((image) => ({
        trimId: trim,
        image
    }))

    await TrimImages.destroy({
        where: {
            trimId: trim
        }
    })

    await TrimImages.bulkCreate(trimImages);

    const trimVideos = videos.map((video) => ({
        trimId: trim,
        video
    }))

    await TrimVideos.destroy({
        where: {
            trimId: trim
        }
    })

    await TrimVideos.bulkCreate(trimVideos);

    await redisClient.del("trims");

    res.status(201).json({ message: "Trim Updated" });
});

module.exports.getTrimsByModel = asyncHandler(async (req, res, next) => {

    const { model } = req.params;
    const { query } = req;

    let isAll = query.isAll ?? false;

    let pageSize = query.pageSize ?? 10;
    let currentPage = query.currentPage ?? 1;
    let orderBy = query.orderBy ? [
        [query.orderBy, "ASC"]
    ] : null;
    let where = {
        model
    };
    let conditions = {
        raw: true,
        where
    };
    if (query.search) {
        where.name = { [Op.iLike]: `%${query.search}%` }
    }


    if (!isAll) {
        conditions = {
            where,
            limit: pageSize,
            offset: (currentPage - 1) * pageSize,
            order: orderBy,
            raw: true
        }
    }

    let trims = { rows: [], count: 0 };

    trims = await Trim.findAndCountAll(conditions);

    trims.rows = await Promise.all(
        trims.rows.map(async trim => {
            trim.brand = await CarBrand.findByPk(trim.brand);
            trim.model = await Model.findByPk(trim.model, {
                attributes: ["id", "name"]
            });
            trim.images = await TrimImages.findAll({
                where: {
                    trimId: trim.id
                }
            })
            trim.videos = await TrimVideos.findAll({
                where: {
                    trimId: trim.id
                }
            })
            return trim;
        })
    )

    res
        .status(200)
        .json({ trims: trims.rows, trimsCount: trims.count, totalPage: Math.ceil(trims.count / pageSize) });
});

module.exports.getTrimsByModelMin = asyncHandler(async (req, res, next) => {

    const { model } = req.params;
    let where = {
        model
    };
    let conditions = {
        raw: true,
        where
    };

    let trims = await Trim.findAll(conditions);

    res
        .status(200)
        .json({ trims });
});

module.exports.getTrimsByModelMinAndYear = asyncHandler(async (req, res, next) => {

    const { model, year } = req.params;
    let where = {
        model,
        year
    };
    let conditions = {
        raw: true,
        where
    };

    let trims = await Trim.findAll(conditions);

    res
        .status(200)
        .json({ trims });
});

module.exports.getTrimsBySlug = asyncHandler(async (req, res, next) => {

    const { trim: slug } = req.params;

    let where = {
        slug
    };


    let trim = await Trim.findOne({ where, raw: true });

    if (!trim) {
        return res.status(404).json({
            message: "Trim not found"
        })
    }

    trim.brand = await CarBrand.findByPk(trim.brand);
    trim.model = await Model.findByPk(trim.model, {
        // attributes: ["id", "name"]
    });
    trim.images = await TrimImages.findAll({
        where: {
            trimId: trim.id
        }
    })
    trim.videos = await TrimVideos.findAll({
        where: {
            trimId: trim.id
        }
    })

    trim.allYearMainTrims = await Trim.findAll({
        attributes: ["id", "name", "year", "featuredImage", "slug"],
        where: {
            model: trim.model,
            slug: trim.slug
        }
    });


    res
        .status(200)
        .json({ trim });
});

module.exports.getTrimsBySlug = asyncHandler(async (req, res, next) => {

    const { trim: slug } = req.params;

    let where = {
        slug
    };


    let trim = await Trim.findOne({ where, raw: true });

    if (!trim) {
        return res.status(404).json({
            message: "Trim not found"
        })
    }

    trim.brand = await CarBrand.findByPk(trim.brand);
    trim.model = await Model.findByPk(trim.model, {
        // attributes: ["id", "name"]
    });
    trim.images = await TrimImages.findAll({
        where: {
            trimId: trim.id
        }
    })
    trim.videos = await TrimVideos.findAll({
        where: {
            trimId: trim.id
        }
    })


    res
        .status(200)
        .json({ trim });
});

module.exports.getTrimsBySlugAndYear = asyncHandler(async (req, res, next) => {

    const { trim: slug, year } = req.params;

    let where = {
        slug,
        year
    };


    let trim = await Trim.findOne({ where, raw: true });

    if (!trim) {
        return res.status(404).json({
            message: "Trim not found"
        })
    }

    trim.brand = await CarBrand.findByPk(trim.brand);
    trim.model = await Model.findByPk(trim.model, {
        // attributes: ["id", "name"]
    });
    trim.images = await TrimImages.findAll({
        where: {
            trimId: trim.id
        }
    })
    trim.videos = await TrimVideos.findAll({
        where: {
            trimId: trim.id
        }
    })


    res
        .status(200)
        .json({ trim });
});

module.exports.getTrimsBySlugAndYearWithModel = asyncHandler(async (req, res, next) => {

    const { trim: slug, model, year } = req.params;

    let modelData = await Model.findOne({
        where: {
            slug: model
        }
    })

    let where = {
        slug,
        model: modelData.id,
        year
    };


    let trim = await Trim.findOne({ where, raw: true });

    if (!trim) {
        return res.status(404).json({
            message: "Trim not found"
        })
    }

    trim.brand = await CarBrand.findByPk(trim.brand);
    trim.model = await Model.findByPk(trim.model, {
        // attributes: ["id", "name"]
    });
    trim.images = await TrimImages.findAll({
        where: {
            trimId: trim.id
        }
    })
    trim.videos = await TrimVideos.findAll({
        where: {
            trimId: trim.id
        }
    })

    trim.allYearMainTrims = await Trim.findAll({
        attributes: ["id", "name", "year", "featuredImage", "slug"],
        where: {
            model: modelData.id,
            slug: trim.slug
        }
    });

    res
        .status(200)
        .json({ trim });
});

module.exports.getTrimsYearByModel = asyncHandler(async (req, res, next) => {

    const { modelId } = req.params;

    const trims = await Trim.findAll({
        attributes: ['year'],
        group: ['year'],
        where: {
            model: modelId
        }

    });


    res
        .status(200)
        .json({ trimYears: trims });
});

module.exports.getTrimMinMaxFilterPrice = asyncHandler(async (req, res, next) => {

    const { query } = req;

    let where = {};

    if (query.isLuxury) {
        where.isLuxury = true
    }

    if (query.isPremiumLuxury) {
        where.isPremiumLuxury = true
    }

    if (query.isSafety) {
        where.isSafety = true
    }

    if (query.isFuelEfficient) {
        where.isFuelEfficient = true
    }

    if (query.isOffRoad) {
        where.isOffRoad = true
    }

    if (query.haveMusic) {
        where.haveMusic = true
    }

    if (query.haveTechnology) {
        where.haveTechnology = true
    }

    if (query.havePerformance) {
        where.havePerformance = true
    }

    if (query.isSpacious) {
        where.isSpacious = true
    }

    if (query.isElectric) {
        where.isElectric = true
    }

    const min = await Trim.min("price", {
        where

    });

    const max = await Trim.max("price", {
        where

    });


    res
        .status(200)
        .json({ min, max });
});

module.exports.getTrimsByFilter = asyncHandler(async (req, res, next) => {

    const { query } = req;

    let where = {};

    if (query.isLuxury) {
        where.isLuxury = true
    }

    if (query.isPremiumLuxury) {
        where.isPremiumLuxury = true
    }

    if (query.isSafety) {
        where.isSafety = true
    }

    if (query.isFuelEfficient) {
        where.isFuelEfficient = true
    }

    if (query.isOffRoad) {
        where.isOffRoad = true
    }

    if (query.haveMusic) {
        where.haveMusic = true
    }

    if (query.haveTechnology) {
        where.haveTechnology = true
    }

    if (query.havePerformance) {
        where.havePerformance = true
    }

    if (query.isSpacious) {
        where.isSpacious = true
    }

    if (query.isElectric) {
        where.isElectric = true
    }

    let seatingCapacity = []

    if (query.isTwoSeat) {
        seatingCapacity.push("2 Seater")
    }

    if (query.isTwoPlusTwo) {
        seatingCapacity.push("2 Seater")
        seatingCapacity.push("4 Seater")
    }

    if (query.isFourToFive) {
        seatingCapacity.push("4 Seater")
        seatingCapacity.push("5 Seater")
    }

    if (query.isFiveToSeven) {
        seatingCapacity.push("5 Seater")
        seatingCapacity.push("6 Seater")
        seatingCapacity.push("7 Seater")
    }

    if (query.isSevenToNine) {
        seatingCapacity.push("7 Seater")
        seatingCapacity.push("8 Seater")
        seatingCapacity.push("9 Seater")
    }

    where.price = {}

    if (query.min) {
        where.price = {
            ...where.price,
            [Op.gte]: query.min
        }
    }

    if (query.max) {
        where.price = {
            ...where.price,
            [Op.lte]: query.max
        }
    }

    seatingCapacity = [...new Set(seatingCapacity)]

    if (seatingCapacity.length !== 0) {

        where.seatingCapacity = { [Op.or]: seatingCapacity }
    }

    let isAll = query.isAll ?? false;

    let pageSize = query.pageSize ?? 10;
    let currentPage = query.currentPage ?? 1;
    let orderBy = query.orderBy ? [
        [query.orderBy, "ASC"]
    ] : null;
    if (query.search) {
        where.name = { [Op.iLike]: `%${query.search}%` }
    }

    let conditions = {
        attributes: [[Sequelize.fn('DISTINCT', Sequelize.col("model")), "model"]],
        raw: true
    };
    if (!isAll) {
        conditions = {
            attributes: [[Sequelize.fn('DISTINCT', Sequelize.col("model")), "model"]],
            where,
            limit: pageSize,
            offset: (currentPage - 1) * pageSize,
            // order: orderBy,
            raw: true
        }
    }

    let trims = { rows: [], count: 0 };

    trims.count = await Trim.count({
        where,
        distinct: true,
        col: 'model'
    });

    let trimItems = await Trim.findAndCountAll(conditions);

    let modelIds = trimItems.rows.map(trim => trim.model);

    let modelByMainTrim = await Model.findAll({
        attributes: ["id", "highTrim"],
        where: {
            id: modelIds
        },
        raw: true
    })

    modelByMainTrim = await Promise.all(
        modelByMainTrim.map(async model => {

            if (model.highTrim) {
                model.mainTrim = { id: model.highTrim }
            } else {
                let highestYear = await Trim.max("year", {
                    where: {
                        model: model.id
                    },
                })
                model.mainTrim = await Trim.findOne({
                    attributes: ["id"],
                    where: {
                        model: model.id,
                        year: highestYear
                    },
                    raw: true
                });
            }

            return model;
        })
    )

    let trimIds = modelByMainTrim.map(model => model.mainTrim.id)

    conditions.where = {
        id: trimIds
    }
    conditions.orderBy = orderBy

    delete conditions.attributes;

    trims.rows = await Trim.findAll(conditions);

    trims.rows = await Promise.all(
        trims.rows.map(async trim => {
            trim.brand = await CarBrand.findByPk(trim.brand);
            trim.minPrice = await Trim.min("price", {
                where: {
                    model: trim.model
                }
            })
            trim.maxPrice = await Trim.max("price", {
                where: {
                    model: trim.model
                }
            })
            trim.model = await Model.findByPk(trim.model, {
                attributes: ["id", "name"]
            });
            trim.images = await TrimImages.findAll({
                where: {
                    trimId: trim.id
                }
            })
            trim.videos = await TrimVideos.findAll({
                where: {
                    trimId: trim.id
                }
            })
            return trim;
        })
    )

    // trims = await Trim.findAndCountAll(conditions);

    // trims.rows = await Promise.all(
    //     trims.rows.map(async trim => {
    //         trim.brand = await CarBrand.findByPk(trim.brand);
    //         trim.model = await Model.findByPk(trim.model, {
    //             attributes: ["id", "name"]
    //         });
    //         trim.images = await TrimImages.findAll({
    //             where: {
    //                 trimId: trim.id
    //             }
    //         })
    //         trim.videos = await TrimVideos.findAll({
    //             where: {
    //                 trimId: trim.id
    //             }
    //         })
    //         return trim;
    //     })
    // )

    res
        .status(200)
        .json({ trims: trims.rows, trimsCount: trims.count, totalPage: Math.ceil(trims.count / pageSize) });
});

module.exports.getTrimsBodyType = asyncHandler(async (req, res, next) => {

    let bodyType = await Trim.findAll({
        attributes: ['bodyType'],
        group: ['bodyType']
    });

    bodyType = bodyType.map(item => item.bodyType)

    res
        .status(200)
        .json({ bodyType });
});

module.exports.getTrimsFuelType = asyncHandler(async (req, res, next) => {

    let fuelType = await Trim.findAll({
        attributes: ['fuelType'],
        group: ['fuelType']
    });

    fuelType = fuelType.map(item => item.fuelType)

    res
        .status(200)
        .json({ fuelType });
});

module.exports.getTrimsByAdvancedSearch = asyncHandler(async (req, res, next) => {

    const { body, query } = req;

    let where = {};

    where.price = {}

    if (body.min) {
        where.price = {
            ...where.price,
            [Op.gte]: body.min
        }
    }

    if (body.max) {
        where.price = {
            ...where.price,
            [Op.lte]: body.max
        }
    }

    where.power = {}

    if (body.minPower) {
        where.power = {
            ...where.power,
            [Op.gte]: String(body.minPower)
        }
    }

    if (body.maxPower) {
        where.power = {
            ...where.power,
            [Op.lte]: String(body.maxPower)
        }
    }

    if (body.brand && body.brand.length != 0) {
        where.brand = body.brand
    }

    if (body.bodyType && body.bodyType.length != 0) {
        where.bodyType = body.bodyType
    }

    if (body.fuelType && body.fuelType.length != 0) {
        where.fuelType = body.fuelType
    }

    if (body.transmission && body.transmission.length != 0) {
        where.transmission = body.transmission
    }

    if (body.cylinders && body.cylinders.length != 0) {
        let cylinders = body.cylinders.map((item) => String(item))
        where.cylinders = cylinders
    }

    let isAll = query.isAll ?? false;

    let pageSize = query.pageSize ?? 10;
    let currentPage = query.currentPage ?? 1;
    let orderBy = query.orderBy ? [
        [query.orderBy, "ASC"]
    ] : null;
    if (query.search) {
        where.name = { [Op.iLike]: `%${query.search}%` }
    }

    let conditions = {
        attributes: [[Sequelize.fn('DISTINCT', Sequelize.col("model")), "model"]],
        raw: true,
        where,
        // group: ['model']
    };
    if (!isAll) {
        conditions = {
            where,
            limit: pageSize,
            offset: (currentPage - 1) * pageSize,
            // order: orderBy,
            raw: true,
            attributes: [[Sequelize.fn('DISTINCT', Sequelize.col("model")), "model"]],
            // group: ['model']
        }
    }

    let trims = { rows: [], count: 0 };

    trims.count = await Trim.count({
        where,
        distinct: true,
        col: 'model'
    });

    let trimItems = await Trim.findAndCountAll(conditions);

    let modelIds = trimItems.rows.map(trim => trim.model);

    let modelByMainTrim = await Model.findAll({
        attributes: ["id", "highTrim"],
        where: {
            id: modelIds
        },
        raw: true
    })

    modelByMainTrim = await Promise.all(
        modelByMainTrim.map(async model => {

            if (model.highTrim) {
                model.mainTrim = { id: model.highTrim }
            } else {
                let highestYear = await Trim.max("year", {
                    where: {
                        model: model.id
                    },
                })
                model.mainTrim = await Trim.findOne({
                    attributes: ["id"],
                    where: {
                        model: model.id,
                        year: highestYear
                    },
                    raw: true
                });
            }

            return model;
        })
    )

    let trimIds = modelByMainTrim.map(model => model.mainTrim.id)

    conditions.where = {
        id: trimIds
    }
    conditions.orderBy = orderBy

    delete conditions.attributes;
    delete conditions.offset;
    delete conditions.limit;

    trims.rows = await Trim.findAll(conditions);

    console.log("trims.rows ", trims.rows);
    trims.rows = await Promise.all(
        trims.rows.map(async trim => {
            trim.brand = await CarBrand.findByPk(trim.brand);
            trim.minPrice = await Trim.min("price", {
                where: {
                    model: trim.model
                }
            })
            trim.maxPrice = await Trim.max("price", {
                where: {
                    model: trim.model
                }
            })
            trim.allTrimsCount = await Trim.count({
                where: {
                    model: trim.model,
                    year: trim.year,
                    id: {
                        [Op.ne]: trim.id
                    }
                },
            })
            trim.allTrims = await Trim.findAll({
                where: {
                    model: trim.model,
                    year: trim.year,
                    id: {
                        [Op.ne]: trim.id
                    }
                },
                limit: 5,
                raw: true
            })
            trim.model = await Model.findByPk(trim.model, {
                attributes: ["id", "name"]
            });
            trim.images = await TrimImages.findAll({
                where: {
                    trimId: trim.id
                }
            })
            trim.videos = await TrimVideos.findAll({
                where: {
                    trimId: trim.id
                }
            })

            return trim;
        })
    )

    res
        .status(200)
        .json({ trims: trims.rows, trimsCount: trims.count, totalPage: Math.ceil(trims.count / pageSize) });
});

module.exports.getCompareTrims = asyncHandler(async (req, res, next) => {

    const { slug } = req.params;

    let mainSlugs = slug.split('-vs-');
    let where = {
        mainSlug: mainSlugs
    };

    let conditions = {
        raw: true,
        where
    };

    let trims = await Trim.findAll(conditions);

    trims = await Promise.all(
        trims.map(async trim => {
            trim.brand = await CarBrand.findByPk(trim.brand);
            trim.model = await Model.findByPk(trim.model, {
                attributes: ["id", "name"]
            });
            trim.images = await TrimImages.findAll({
                where: {
                    trimId: trim.id
                }
            })
            trim.videos = await TrimVideos.findAll({
                where: {
                    trimId: trim.id
                }
            })
            return trim;
        })
    )

    res
        .status(200)
        .json({ trims });
});

const fieldValidation = (field, next) => {
    if (!field) {
        return new ErrorResponse(`Missing fields`, 400);
    }
};
