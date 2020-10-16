const db = require("./config/config");
const user = require("./models/user/user")(db.sequelize, db.Sequelize);
const userSetting = require("./models/user/userSet")(
  db.sequelize,
  db.Sequelize
);
const news = require("./models/news/news")(db.sequelize, db.Sequelize);
const newsReply = require("./models/news/newsReply")(
  db.sequelize,
  db.Sequelize
);
const newsReplyScore = require("./models/news/newsReplyScore")(
  db.sequelize,
  db.Sequelize
);
const newsReport = require("./models/news/newsReport")(
  db.sequelize,
  db.Sequelize
);
const newsEdit = require("./models/news/newsEdit")(db.sequelize, db.Sequelize);
const newsContents = require("./models/news/newsContents")(
  db.sequelize,
  db.Sequelize
);
const newsScore = require("./models/news/newsScore")(
  db.sequelize,
  db.Sequelize
);

module.exports.syncDB = async function (event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    await user.sync();
    await userSetting.sync();
    await news.sync();
    await newsReply.sync();
    await newsReplyScore.sync();
    await newsReport.sync();
    await newsEdit.sync();
    await newsContents.sync();
    await newsScore.sync();
    await callback(null, {
      statusCode: 200,
      headers: { "Content-Type": "text/plain" },
      body: "good",
    });
  } catch (e) {
    callback(e);
  }
};
