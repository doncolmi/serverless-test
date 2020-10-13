// uuid, newsId, item, type

"use strict";
const db = require("../config/db");

const user = require("./user")(db.sequelize, db.Sequelize);
const news = require("./news")(db.sequelize, db.Sequelize);

module.exports = function (sequelize, DataTypes) {
  const NewsEdit = sequelize.define("newsEdit", {
    type: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    item: {
      type: DataTypes.STRING(300),
      allowNull: true,
    },
    createdDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  });
  user.hasMany(NewsEdit, { foreignKey: "uuid" });
  news.hasMany(NewsEdit, { foreignKey: "newsId" });
  return NewsEdit;
};
