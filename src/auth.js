const db = require("./config/db");
const user = require("./models/user/user")(db.sequelize, db.Sequelize);
const userSet = require("./models/user/userSet")(db.sequelize, db.Sequelize);

const axios = require("axios");
const uuid = require("uuid4");

/** @description login and join
 * @requires Authorization in header
 * @return {JSON}
 */
module.exports.login = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;

  const token = event.headers.Authorization;
  const tokenHeader = { Authorization: token };
  const url = `https://kapi.kakao.com/v1/user/access_token_info`;
  const { data } = await axios.get(url, { headers: tokenHeader }).catch((e) => {
    callback(e);
  });

  if (data.id) {
    const getUser = await user.findOrCreate({
      where: { uuid: data.id },
      defaults: { name: uuid().split("-")[0], createdUuid: data.id },
    });
    const userInfo = getUser[0].dataValues;
    const isJoin = getUser[1];
    const getUserSet = await userSet.findOrCreate({
      where: { uuid: data.id },
      defaults: { createdUuid: data.id },
    });
    const userSetInfo = getUserSet[0].dataValues;
    await callback(null, {
      statusCode: isJoin ? 201 : 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...userInfo, ...userSetInfo }),
    });
  } else {
    callback(e);
  }
};
