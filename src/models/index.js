const fs = require("fs");
const path = require("path");
const Sequelize = require("sequelize");
const basename = path.basename(__filename);
const mode = process.env.NODE_ENV || "development";
const env = require("../config/env.json")[mode];
const db = {};

let sequelize = new Sequelize(env.database, env.username, env.password, {
  host: env.host,
  port: env.port,
  logging: env.logging, // 람다 실행시 로깅 활성화하면 시간이 오래걸려요...
  dialect: env.dialect,
  timezone: "Etc/GMT-9",
  define: {
    timestamps: false,
  },
  operatorsAliases: false,
  pool: {
    max: 5,
    min: 0,
    acquire: 20000,
    idle: 10000,
  },
});

const hi = fs.readdirSync(__dirname).filter((dir) => dir !== basename);
for (const dir of hi) {
  const dirPath = `${__dirname.trim()}\\${dir}`;
  const hello = fs.readdirSync(dirPath);
  for (const file of hello) {
    const model = require(path.join(dirPath, file))(
      sequelize,
      Sequelize.DataTypes
    );
    db[model.name] = model;
  }
}

Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

// newsReply 1:Many
db.user.hasMany(db.newsReply);
db.news.hasMany(db.newsReply);
db.newsReply.belongsTo(db.user);
db.newsReply.belongsTo(db.news);

// newsReplyScore 1:Many
db.user.hasMany(db.newsReplyScore);
db.newsReply.hasMany(db.newsReplyScore);
db.newsReplyScore.belongsTo(db.user);
db.newsReplyScore.belongsTo(db.newsReply);

// newsEdit 1:Many
db.user.hasMany(db.newsEdit, { foreignKey: "userUuid" });
db.news.hasMany(db.newsEdit, { foreignKey: "newsId" });
db.newsEdit.belongsTo(db.user);
db.newsEdit.belongsTo(db.news);

// newsContents 1:1
db.newsContents.belongsTo(db.news, { foreignKey: "id" });

// newsReport 1:Many
db.user.hasMany(db.newsReport);
db.newsReply.hasMany(db.newsReport);
db.newsReport.belongsTo(db.user);
db.newsReport.belongsTo(db.newsReply);

// newsScore 1:Many
db.user.hasMany(db.newsScore);
db.news.hasMany(db.newsScore);
db.newsScore.belongsTo(db.user);
db.newsScore.belongsTo(db.news);

// userSetting 1:1
db.UserSetting.belongsTo(db.user, { foreignKey: "uuid" });

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
