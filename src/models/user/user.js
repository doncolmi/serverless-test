"use strict";
module.exports = function (sequelize, DataTypes) {
  const User = sequelize.define("user", {
    uuid: {
      type: DataTypes.STRING(20),
      primaryKey: true,
      allowNull: false,
      unique: true,
    },
    name: {
      type: DataTypes.STRING(15),
      allowNull: false,
      unique: true,
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
      type: DataTypes.STRING(20),
    },
    modifiedUuid: {
      type: DataTypes.STRING(20),
    },
  });
  return User;
};
