"use strict";
const db = require("../config/db");

const user = require("./user")(db.sequelize, db.Sequelize);
const news = require("./news")(db.sequelize, db.Sequelize);

module.exports = function (sequelize, DataTypes) {
  const NewsReply = sequelize.define("newsReply", {
    type: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    item: {
      type: DataTypes.STRING(300),
      allowNull: true,
    },
    contents: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    score: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    parents: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    isIssueEnd: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    isSelection: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    isBlocked: {
      type: DataTypes.BOOLEAN,
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
    modifiedUuid: {
      type: DataTypes.STRING(32),
    },
  });
  user.hasMany(NewsReply, { foreignKey: "createdUuid" });
  news.hasMany(NewsReply, { foreignKey: "newsId" });
  return NewsReply;
};
