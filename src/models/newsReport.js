"use strict";
const db = require("../config/db");

const user = require("./user")(db.sequelize, db.Sequelize);
const newsReply = require("./newsReply")(db.sequelize, db.Sequelize);

module.exports = function (sequelize, DataTypes) {
  const NewsReplyScore = sequelize.define("newsReplyScore", {
    type: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    contents: { type: DataTypes.TEXT, allowNull: true },
    createdDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  });
  user.hasMany(NewsReplyScore, { foreignKey: "createdUuid" });
  newsReply.hasMany(NewsReplyScore, { foreignKey: "newsReplyId" });
  return NewsReplyScore;
};
