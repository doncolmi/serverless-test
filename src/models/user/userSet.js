"use strict";

const db = require("../../config/config");
const User = require("./user")(db.sequelize, db.Sequelize);

module.exports = function (sequelize, DataTypes) {
  const UserSetting = sequelize.define("UserSetting", {
    isChangeName: {
      type: DataTypes.TINYINT(1),
      allowNull: false,
      defaultValue: 0,
    },
    isViewReply: {
      type: DataTypes.TINYINT(1),
      allowNull: false,
      defaultValue: 1,
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
  UserSetting.belongsTo(User, {
    foreignKey: { name: "uuid" },
    onDelete: "CASCADE",
  });
  return UserSetting;
};
