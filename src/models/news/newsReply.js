"use strict";
const db = require("../../config/config");

const User = require("../user/user")(db.sequelize, db.Sequelize);
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
    isSelection: {
      type: DataTypes.TINYINT(1),
      allowNull: true,
      defaultValue: 0,
    },
    isBlocked: {
      type: DataTypes.TINYINT(1),
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
    name: {
      type: DataTypes.STRING(15),
      allowNull: false,
    },
  });
  User.hasMany(NewsReply);
  news.hasMany(NewsReply);
  return NewsReply;
};
