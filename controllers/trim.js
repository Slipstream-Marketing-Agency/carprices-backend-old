const { where, Op } = require("sequelize");
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
        haveFrontBrakes,
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
        images,
        videos
    } = req.body.trim;

    fieldValidation(name, next);
    fieldValidation(brand, next);
    fieldValidation(year, next);
    fieldValidation(isElectric, next);

    const slug = slugify(name, {
        lower: true
    });

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
        haveFrontBrakes,
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
        slug
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
        haveFrontBrakes,
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
        images,
        videos
    } = req.body.trim;

    fieldValidation(name, next);
    fieldValidation(brand, next);
    fieldValidation(year, next);
    fieldValidation(isElectric, next);

    const slug = slugify(name, {
        lower: true
    });

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
        haveFrontBrakes,
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
        slug
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

const fieldValidation = (field, next) => {
    if (!field) {
        return new ErrorResponse(`Missing fields`, 400);
    }
};
