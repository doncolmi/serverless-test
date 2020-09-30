"use strict";

module.exports = function (sequelize, DataTypes) {
  const User = sequelize.define("user", {
    uuid: {
      type: DataTypes.STRING(32),
      min: 32,
      primaryKey: true,
      allowNull: false,
      unique: true,
    },
    email: {
      type: DataTypes.STRING(60),
      allowNull: false,
      unique: true,
      validate: {
        is: /^[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*.[a-zA-Z]{2,3}$/i,
      },
    },
    name: {
      type: DataTypes.STRING(15),
      allowNull: false,
      unique: true,
      min: 2,
    },
    pwd: {
      type: DataTypes.STRING(256),
      allowNull: false,
    },
    salt: {
      type: DataTypes.STRING(256),
      allowNull: false,
    },
    createdDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    modifiedDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    createdUuid: {
      type: DataTypes.STRING(32),
    },
    modifiedUuid: {
      type: DataTypes.STRING(32),
    },
  });
  return User;
};
