// import database setting
const db = require("./config/db");

//import Schema
const newsScore = require("./models/newsScore");
const news = require("./models/news")(db.sequelize, db.Sequelize);
const newsEdit = require("./models/newsEdit")(db.sequelize, db.Sequelize);
const newsScore = require("./models/newsScore")(db.sequelize, db.Sequelize);
const newsContents = require("./models/newsContents")(
  db.sequelize,
  db.Sequelize
);

/** @description count rows in news Table for paging
 * @return {JSON}
 */
module.exports.countAllNews = async function (event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    const cntNews = await news.count({});
    callback(null, {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cntNews),
    });
  } catch (e) {
    callback(e);
  }
};

/** @description get 5 most recent News for main Page
 * @return {JSON}
 */
module.exports.getRecentNews = async function (event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    const getNews = await news.findAll({
      limit: 5,
      order: [["date", "DESC"]],
      attributes: [
        "id",
        "translatedTitle",
        "title",
        "topic",
        "href",
        "date",
        "reply",
        "tag",
      ],
    });

    if (getNews.length > 0) {
      callback(null, {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(getNews),
      });
    } else {
      callback(null, {
        statusCode: 500,
        headers: { "Content-Type": "text/plain" },
        body: "Server Error",
      });
    }
  } catch (e) {
    callback(e);
  }
};

/** @description get NewsList
 * @param {number} page List Page
 * @return {JSON}
 */
module.exports.getNewsList = async function (event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    let page = 0;
    if (event.queryStringParameters.page) {
      page = event.queryStringParameters.page * 1;
    }
    const cnt = await news.count({});
    const maxPage = parseInt(cnt / 10);
    if (page > maxPage) page = maxPage;

    const getNewsList = await news.findAll({
      offset: page * 10,
      limit: 10,
      order: [["date", "DESC"]],
      attributes: [
        "id",
        "translatedTitle",
        "title",
        "topic",
        "href",
        "date",
        "tag",
        "reply",
        "view",
      ],
    });

    if (getNewsList.length > 0) {
      callback(null, {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(getNewsList),
      });
    } else {
      callback(null, {
        statusCode: 500,
        headers: { "Content-Type": "text/plain" },
        body: "Server Error",
      });
    }
  } catch (e) {
    callback(e);
  }
};

/** @description get News
 * @param {number} newsId NewsId the user wants
 * @return {JSON}
 */
module.exports.getNews = async function (event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    const newsId = event.pathParameters.newsId;
    const getNews = await news.findOne({ where: { id: newsId } });
    if (getNews) {
      await news.update({ view: getNews.view + 1 }, { where: { id: newsId } });
      callback(null, {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(getNews),
      });
    } else {
      callback(null, {
        statusCode: 404,
        headers: { "Content-Type": "text/plain" },
        body: "Not Found",
      });
    }
  } catch (e) {
    callback(e);
  }
};

/** @description To bring the link registered by the user
 * @param {number} newsId Primary Key from news Table
 * @return {JSON}
 */
module.exports.getNewsUserLink = async function (event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    const id = event.pathParameters.newsId;
    const items = await newsEdit.findAll({
      where: { newsId: id, type: "link" },
      attributes: ["item"],
    });
    await callback(null, {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(items),
    });
  } catch (e) {
    callback(e);
  }
};

// todo: getNewsScore 만들어야합니다!
// todo: 아직 아래 yml에 등록안함!!

/** @description post newsScore
 * @param {string} uuid Primary Key from user Table
 * @param {number} newsId Primary Key from news Table
 * @return {JSON}
 */
module.exports.postNewsScore = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;

  const { newsId, uuid } = JSON.parse(event.body);

  // duplicate check
  const isDuplicate =
    (await newsScore.count({ where: { newsId: newsId, uuid: uuid } })) < 1;
  if (isDuplicate) {
    callback(null, {
      statusCode: 409,
      headers: { "Content-Type": "text/plain" },
      body: `Duplicate Vote`,
    });
  } else {
    // newsScore check
    try {
      const NewsContent = await newsContents.findOne({
        where: { newsId: newsId },
      });
      const { score, contents } = NewsContent.dataValues;

      if (contents) {
        callback(null, {
          statusCode: 409,
          headers: { "Content-Type": "text/plain" },
          body: `Already finished`,
        });
      } else {
        await newsContents.update(
          {
            score: db.sequelize.literal(`score + 1`),
            modifiedUuid: uuid,
            modifiedDate: new Date(),
          },
          { where: { newsId: newsId } }
        );
        await newsScore.create({ newsId: newsId, uuid: uuid });
        if (score < 29) {
          callback(null, {
            statusCode: 201,
            headers: { "Content-Type": "text/plain" },
            body: `투표 성공!`,
          });
        } else {
          callback(null, {
            statusCode: 202,
            headers: { "Content-Type": "text/plain" },
            body: `투표가 완료되었습니다! 빠른 시간 내에 본문을 번역하여 가져오겠습니다!`,
          });
        }
      }
    } catch (e) {
      callback(e);
    }
  }
};
