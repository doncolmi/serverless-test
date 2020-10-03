"use strict";

module.exports = function (sequelize, DataTypes) {
  const News = sequelize.define("news", {
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    topic: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },
    translatedTitle: {
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
  return News;
};
