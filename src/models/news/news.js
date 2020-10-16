"use strict";

const db = require("../../config/config");
const NewsEdit = require("../news/NewsEdit")(db.sequelize, db.Sequelize);

module.exports = function (sequelize, DataTypes) {
  const News = sequelize.define("news", {
    thumbnail: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    topic: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    translatedTitle: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    prevTitle: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    href: {
      type: DataTypes.STRING(256),
      allowNull: false,
      unique: true,
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    tag: {
      type: DataTypes.STRING(300),
      allowNull: true,
    },
    view: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    reply: {
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
  News.hasMany(NewsEdit, { foreignKey: "newsId" });

  return News;
};
