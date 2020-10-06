const db = require("./config/db");
const { kakao } = require("./config/env.json")["development"];
const user = require("./models/user")(db.sequelize, db.Sequelize);

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
    const userData = await user.findOrCreate({
      where: { uuid: data.id },
      defaults: { name: makeRandomName(), createdUuid: data.id },
    });
    await succesCallback(
      callback,
      userData[1] ? 201 : 200,
      JSON.stringify(userData[0].dataValues),
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
