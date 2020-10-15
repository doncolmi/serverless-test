"use strict";
const db = require("../../config/db");
const user = require("../user/user")(db.sequelize, db.Sequelize);
const news = require("./news")(db.sequelize, db.Sequelize);
const newsReply = require("./newsReply")(db.sequelize, db.Sequelize);

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
  });
  user.hasMany(NewsReplyScore, { foreignKey: "createdUuid" });
  news.hasMany(NewsReplyScore, { foreignKey: "newsId" });
  newsReply.hasMany(NewsReplyScore, { foreignKey: "newsReplyId" });
  return NewsReplyScore;
};
