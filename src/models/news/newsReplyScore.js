"use strict";

module.exports = function (sequelize, DataTypes) {
  const NewsReplyScore = sequelize.define("newsReplyScore", {
    type: {
      type: DataTypes.TINYINT(1),
      allowNull: false,
    },
    createdDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    userUuid: {
      type: DataTypes.STRING(20),
    },
    newsReplyId: {
      type: DataTypes.INTEGER(11),
    },
  });
  return NewsReplyScore;
};
