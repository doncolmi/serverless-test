"use strict";

const Sequelize = require("sequelize");
const mode = process.env.NODE_ENV || "development";
const env = require("./env.json")[mode];

const sequelize = new Sequelize(env.database, env.username, env.password, {
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

module.exports = {
  Sequelize: Sequelize,
  sequelize: sequelize,
};
