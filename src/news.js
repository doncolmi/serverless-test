//import Schema
const { sequelize, Sequelize } = require("./models");
const news = require("./models/news/news")(sequelize, Sequelize);
const newsContents = require("./models/news/newsContents")(
  sequelize,
  Sequelize
);
const newsScore = require("./models/news/newsScore")(sequelize, Sequelize);
const newsEdit = require("./models/news/newsEdit")(sequelize, Sequelize);

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

/** @description get NewsContents
 * @param {number} newsId Primary Key from news Table
 * @return {JSON}
 */
module.exports.getNewsContents = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;

  const newsId = event.pathParameters.newsId;
  const { dataValues } = await newsContents.findOne({ where: { id: newsId } });
  if (dataValues) {
    callback(null, {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dataValues),
    });
  } else {
    callback(null, {
      statusCode: 404,
      headers: { "Content-Type": "text/plain" },
      body: "Not Found",
    });
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

  const ec = async (code, body) =>
    await callback(null, {
      statusCode: code,
      headers: { "Content-Type": "text/plain" },
      body: body,
    });

  const newsId = event.pathParameters.newsId;
  const { uuid } = JSON.parse(event.body);

  if (!event.headers.Authorization) {
    await ec(403, "Forbidden");
    return;
  }

  // duplicate check
  const isDuplicate =
    (await newsScore.count({ where: { newsId: newsId, userUuid: uuid } })) > 0;
  if (isDuplicate) {
    await ec(409, "Duplicate Vote");
  } else {
    // newsScore check
    try {
      const NewsContent = await newsContents.findOne({
        where: { id: newsId },
      });
      const { score, contents } = NewsContent.dataValues;

      if (contents) {
        await ec(406, "Already finished");
      } else {
        await newsScore.create({ newsId: newsId, userUuid: uuid });
        await newsContents.update(
          {
            score: sequelize.literal(`score + 1`),
            modifiedUuid: uuid,
            modifiedDate: new Date(),
          },
          { where: { id: newsId } }
        );
        if (score < 29) {
          await ec(201, "투표 성공!");
        } else {
          await ec(
            202,
            `투표가 완료되었습니다! 빠른 시간 내에 본문을 번역하여 가져오겠습니다!`
          );
        }
      }
    } catch (e) {
      callback(e);
    }
  }
};
