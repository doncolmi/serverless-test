"use strict";
const db = require("../../config/config");

const user = require("../user/user")(db.sequelize, db.Sequelize);
const news = require("./news")(db.sequelize, db.Sequelize);

module.exports = function (sequelize, DataTypes) {
  const NewsScore = sequelize.define("newsScore", {
    createdDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  });
  news.hasMany(NewsScore, { foreignKey: "newsId" });
  user.hasMany(NewsScore, { foreignKey: "uuid" });

  return NewsScore;
};
