const db = require("./config/db");
const { kakao, kakao_secret, kakao_js } = require("./config/env.json")[
  "development"
];
const user = require("./models/user")(db.sequelize, db.Sequelize);
const userSet = require("./models/userSet")(db.sequelize, db.Sequelize);

const axios = require("axios");
const uuid = require("uuid4");

const {
  succesCallback,
  failCallback,
} = require("./middleware/callbackMiddleware");

module.exports.login = async (event, context, callback) => {
  const makeRandomName = () => uuid().split("-")[0];

  const token = event.headers.Authorization;
  const tokenHeader = { Authorization: token };
  const url = `https://kapi.kakao.com/v1/user/access_token_info`;
  const { data } = await axios.get(url, { headers: tokenHeader }).catch((e) => {
    callback(e);
  });

  if (data.id) {
    const getUser = await user.findOrCreate({
      where: { uuid: data.id },
      defaults: { name: makeRandomName(), createdUuid: data.id },
    });
    const userInfo = getUser[0].dataValues;
    const isJoin = getUser[1];
    const getUserSet = await userSet.findOrCreate({
      where: { uuid: data.id },
      defaults: { createdUuid: data.id },
    });
    const userSetInfo = getUserSet[0].dataValues;
    await succesCallback(
      callback,
      isJoin ? 201 : 200,
      JSON.stringify({ ...userInfo, ...userSetInfo }),
      false
    );
  } else {
    callback(null, {
      statusCode: 500,
      headers: { "Content-Type": "text/plain" },
      body: "Error",
    });
  }
};
