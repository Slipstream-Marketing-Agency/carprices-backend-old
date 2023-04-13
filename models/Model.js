const { DataTypes } = require("sequelize");
const sequelize = require("../util/database");

const Model = sequelize.define("model", {
    name: {
        type: DataTypes.STRING(75),
        allowNull: false
    },
    metaTitle: {
        type: DataTypes.STRING(100)
    },
    slug: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true
    },
    description: {
        type: DataTypes.TEXT
    },
    make: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    year: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    published: {
        type: DataTypes.BOOLEAN,
        allowNull: false
    },
    publishedAt: {
        type: DataTypes.DATE
    },
});

module.exports = Model;
