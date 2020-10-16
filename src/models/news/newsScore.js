"use strict";
module.exports = function (sequelize, DataTypes) {
  const NewsScore = sequelize.define("newsScore", {
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
  return NewsScore;
};
