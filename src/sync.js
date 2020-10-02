const db = require("./config/db");
const user = require("./models/user")(db.sequelize, db.Sequelize);
const userSetting = require("./models/userSet")(db.sequelize, db.Sequelize);
const news = require("./models/news")(db.sequelize, db.Sequelize);

const {
  succesCallback,
  failCallback,
} = require("./middleware/callbackMiddleware");

module.exports.syncDB = async function (event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    await user.sync();
    await userSetting.sync();
    await news.sync();
    await succesCallback(callback, 201, "Created!", true);
  } catch (e) {
    console.log(e);
    const errorText = "syncError";
    await failCallback(callback, e.statusCode, errorText, e);
  }
};