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
  timezone: "Etc/GMT+9",
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

console.log(path.dirname());
console.log(db);
