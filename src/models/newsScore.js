// "use strict";
// const db = require("../config/db");

// const news = require("./user")(db.sequelize, db.Sequelize);

// module.exports = function (sequelize, DataTypes) {
//   const NewsContents = sequelize.define("newsContents", {
//     contents: {
//       type: DataTypes.TEXT,
//       allowNull: false,
//     },
//     score: {
//       type: DataTypes.INTEGER,
//       allowNull: false,
//       defaultValue: 0,
//     },
//     createdDate: {
//       type: DataTypes.DATE,
//       defaultValue: DataTypes.NOW,
//     },
//     modifiedDate: {
//       type: DataTypes.DATE,
//       defaultValue: DataTypes.NOW,
//     },
//     createdUuid: {
//       type: DataTypes.STRING(32),
//     },
//     modifiedUuid: {
//       type: DataTypes.STRING(32),
//     },
//   });
//   news.hasMany(NewsContents, { foreignKey: "newsId" });
//   return NewsContents;
// };

//todo : 이거 만들어라!
