const { sequelize } = require("./models");

module.exports.syncDB = async function (event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    await sequelize.sync({ force: true });
    await callback(null, {
      statusCode: 200,
      headers: { "Content-Type": "text/plain" },
      body: "good",
    });
  } catch (e) {
    callback(e);
  }
};
