"use strict";
const db = require("../../config/db");

const news = require("./news")(db.sequelize, db.Sequelize);

module.exports = function (sequelize, DataTypes) {
  const NewsContents = sequelize.define("newsContents", {
    contents: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    score: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    createdDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    modifiedDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    createdUuid: {
      type: DataTypes.STRING(32),
    },
    modifiedUuid: {
      type: DataTypes.STRING(32),
    },
  });
  NewsContents.belongsTo(news, { foreignKey: "newsId" });
  return NewsContents;
};
