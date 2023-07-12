const { DataTypes, Model } = require("sequelize");
const sequelize = require("../util/database");

const WebStory = sequelize.define("webstory", {
    title: {
        type: DataTypes.STRING,
        unique: true
      },
});

module.exports = WebStory;