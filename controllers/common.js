const { where, Op, QueryTypes } = require("sequelize");
const asyncHandler = require("../middlewares/asyncHandler");
const CarBrand = require("../models/CarBrand");
const ErrorResponse = require("../util/errorResponse");
const slugify = require("slugify");

const {
  appendFollowers,
  appendFavorites,
  appendTagList,
} = require("../util/helpers");
const redisClient = require("../util/caching");
const sequelize = require("../util/database");

const includeOptions = [
  // {
  //   model: Tag,
  //   as: "tagLists",
  //   attributes: ["name"],
  //   through: { attributes: [] },
  // },
  // { model: User, as: "author", attributes: { exclude: ["email", "password"] } },
];

module.exports.getCarBrands = asyncHandler(async (req, res, next) => {

  // const cacheResults = await redisClient.get("carBrands");
  // if (cacheResults) {
  //   isCached = true;
  //   results = JSON.parse(cacheResults);
  //   return res
  //   .status(200)
  //   .json(results);
  // } 

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

  let carBrands = { rows: [], count: 0 };

  carBrands = await CarBrand.findAndCountAll(conditions);

  // await redisClient.set("carBrands", JSON.stringify({ carBrands: carBrands.rows, carBrandsCount: carBrands.count }), {
  //   EX: 60 * 60 * 24,
  //   NX: true,
  // });

  res
    .status(200)
    .json({ carBrands: carBrands.rows, carBrandsCount: carBrands.count });
});

module.exports.mainSearch = asyncHandler(async (req, res, next) => {

  const { keyword } = req.params;
  // let keyword = "Audi a7"

  console.log("keyword ", keyword);

  let first_word = ''
  let second_word = ''
  let words = keyword.split("+")
  console.log('www ', words);
  if (words.length == 2) {
    first_word = words[0]+'%'
    second_word = words[1]+'%'
  }else{
    first_word = words[0]+'%'
    second_word = words[0]+'%'
  }

  let search = await sequelize.query(
    'SELECT m.name as modelName, b.name as brandName, t.name as trimName, m.id as modelId, b.id as brandId, t.id as trimId, m.slug as modelSlug, b.slug as brandSlug, t.slug as trimSlug, * FROM trims as t, models as m, car_brands as b WHERE t.model = m.id AND m.brand = b.id AND (b.name ILIKE :search_name OR m.name ILIKE :search_name OR t.name ILIKE :search_name OR b.name ILIKE :first_word OR m.name ILIKE :second_word) LIMIT 5',
    {
      replacements: { search_name: keyword+'%', first_word, second_word },
      type: QueryTypes.SELECT
    }
  );

  res.status(200).json({
    search
  })

});

const fieldValidation = (field, next) => {
  if (!field) {
    return next(new ErrorResponse(`Missing fields`, 400));
  }
};
