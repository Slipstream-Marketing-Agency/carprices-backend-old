const { DataTypes, Model } = require("sequelize");
const sequelize = require("../util/database");

const CarBrand = sequelize.define("car_brand", {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  slug: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  image: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

module.exports = CarBrand;
