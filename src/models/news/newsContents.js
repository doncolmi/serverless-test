"use strict";
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
    modifiedUuid: {
      type: DataTypes.STRING(32),
    },
  });
  return NewsContents;
};
