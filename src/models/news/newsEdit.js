"use strict";

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
    userUuid: {
      type: DataTypes.STRING(20),
    },
    newsId: {
      type: DataTypes.INTEGER(11),
    },
  });
  return NewsEdit;
};
