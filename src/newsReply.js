//import Schema
const { sequelize, Sequelize } = require("./models");
const news = require("./models/news/news")(sequelize, Sequelize);
const newsReply = require("./models/news/newsReply")(sequelize, Sequelize);
const newsReplyScore = require("./models/news/newsReplyScore")(
  sequelize,
  Sequelize
);
const newsEdit = require("./models/news/newsEdit")(sequelize, Sequelize);

/** @description get Reply Count for Users who don't want to see Reply
 * @param {number} newsId Primary Key from news Table
 * @return {number}
 */
module.exports.getReplyCnt = async function (event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    const newsId = event.pathParameters.newsId;
    const cntNews = await newsReply.count({ where: { newsId: newsId } });
    await callback(null, {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cntNews),
    });
  } catch (e) {
    callback(e);
  }
};

/** @description get ReplyList in One news
 * @param {number} newsId Primary Key from news Table
 * @return {JSON}
 */
module.exports.getReply = async function (event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    const newsId = event.pathParameters.newsId;
    const getNews = await newsReply.findAll({
      where: { newsId: newsId },
      order: [["createdDate", "DESC"]],
    });
    callback(null, {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(getNews),
    });
  } catch (e) {
    callback(e);
  }
};

/** @description post Reply
 * @param {string} userUuid Primary Key from user Table
 * @param {number} newsId Primary Key from news Table
 * @param {string} name userName
 * @param {string} type One of three Reply types
 * @param {number} contents reply contents
 * @return {JSON}
 */
module.exports.postReply = async function (event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    if (!event.headers.Authorization) {
      callback(null, {
        statusCode: 403,
        headers: { "Content-Type": "text/plain" },
        body: "403 - Forbidden",
      });
      return;
    }

    const body = JSON.parse(event.body);
    const save = await newsReply.create(body);
    const update = await news.update(
      { reply: sequelize.literal("reply + 1") },
      { where: { id: body.newsId } }
    );

    callback(null, {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(save),
    });
  } catch (e) {
    callback(e);
  }
};

/** @description To get the score of the comment
 * @param {string} id Primary Key from newsReply Table
 * @return {JSON}
 */
module.exports.getReplyScore = async function (event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    const id = event.pathParameters.id;
    const score = await newsReply.findOne({
      where: { id: id },
      attributes: ["score"],
    });
    await callback(null, {
      statusCode: 201,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(score),
    });
  } catch (e) {
    callback(e);
  }
};

/** @description post replyScore
 * @description For comment recommendation and best comment system
 * @param {string} uuid Primary Key from user Table
 * @param {number} newsId Primary Key from news Table
 * @param {number} replyId Primary Key from newsReply Table
 * @param {string} type One of three Reply types
 * @return {JSON}
 */
module.exports.replyScore = async function (event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    // check Auth
    if (!event.headers.Authorization) {
      callback(null, {
        statusCode: 403,
        headers: { "Content-Type": "text/plain" },
        body: "403 - Forbidden",
      });
      return;
    }

    // parse data in body
    const body = JSON.parse(event.body);

    // First, check if you have given a score for the comment through uuid.
    const isScored = await newsReplyScore.count({
      where: { userUuid: body.createdUuid, newsReplyId: body.newsReplyId },
    });

    // If the count is 1 or more, it is a duplicate vote, so 304 code is returned.
    if (isScored > 0) {
      callback(null, {
        statusCode: 304,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Duplicate request" }),
      });
      return;
    }

    // If count is less than 1, log is saved to newsReplyScore.
    const save = await newsReplyScore.create(body);

    // If the news score is 29 and this body type is +, change isSelection to true.
    const { dataValues } = await newsReply.findOne({
      where: { id: body.newsReplyId },
      attributes: ["score", "type", "newsId", "item", "userUuid"],
    });

    const { score, type, item, userUuid, newsId } = dataValues;

    if (score === 29 && body.type) {
      if (type === "title") {
        const newsData = await news.findOne({
          where: { id: body.newsId },
          attributes: ["tag", "translatedTitle"],
        });
        const { tag, translatedTitle } = newsData.dataValues;
        await news.update(
          {
            translatedTitle: item,
            modifiedUuid: userUuid,
            modifiedDate: new Date(),
            prevTitle: translatedTitle,
            tag: tag.replace("AI번역", "유저번역"),
          },
          { where: { id: newsId } }
        );
      }
      if (type !== "default") {
        await newsEdit.create({
          uuid: userUuid,
          newsId: newsId,
          item: item,
          type: type,
        });
      }
      await newsReply.update(
        { isSelection: true },
        { where: { id: body.newsReplyId } }
      );
    } else if (score === 30 && !body.type) {
      await newsReply.update(
        { isSelection: false },
        { where: { id: body.newsReplyId } }
      );
    }
    // 이 부분 왜 요류뜨냐?? todo

    // And it updates the score of the newsReply.
    await newsReply.update(
      { score: sequelize.literal(`score ${body.type ? "+" : "-"} 1`) },
      { where: { id: body.newsReplyId } }
    );

    await callback(null, {
      statusCode: 201,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(save),
    });
  } catch (e) {
    callback(e);
  }
};
