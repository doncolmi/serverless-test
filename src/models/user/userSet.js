"use strict";

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
    uuid: { type: DataTypes.STRING(20) },
  });
  return UserSetting;
};
