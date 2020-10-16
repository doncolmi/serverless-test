"use strict";
module.exports = function (sequelize, DataTypes) {
  const NewsReport = sequelize.define("newsReport", {
    type: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    contents: { type: DataTypes.TEXT, allowNull: true },
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
  return NewsReport;
};
