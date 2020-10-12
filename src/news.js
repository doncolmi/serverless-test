const db = require("./config/db");
const news = require("./models/news")(db.sequelize, db.Sequelize);
const newsReply = require("./models/newsReply")(db.sequelize, db.Sequelize);
const newsReplyScore = require("./models/newsReplyScore")(
  db.sequelize,
  db.Sequelize
);

module.exports.newsAllCount = async function (event, context, callback) {
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

module.exports.getRecentNews = async function (event, context, callback) {
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

module.exports.getNewsList = async function (event, context, callback) {
  try {
    let page = 0;
    if (event.queryStringParameters.page) {
      page = event.queryStringParameters.page * 1;
    }
    const cnt = await news.count({});
    const maxPage = parseInt(cnt / 10);
    if (page > maxPage) page = maxPage;

    const getNews = await news.findAll({
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

module.exports.get = async function (event, context, callback) {
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

module.exports.getReply = async function (event, context, callback) {
  try {
    const newsId = event.pathParameters.newsId;
    const getNews = await newsReply.findAll({
      where: { newsId: newsId },
      order: [["createdDate", "ASC"]],
    });
    await callback(null, {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(getNews),
    });
  } catch (e) {
    callback(e);
  }
};

module.exports.getReplyCnt = async function (event, context, callback) {
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

module.exports.postReply = async function (event, context, callback) {
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
      { reply: db.sequelize.literal("reply + 1") },
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

module.exports.replyScore = async function (event, context, callback) {
  try {
    if (!event.headers.Authorization) {
      callback(null, {
        statusCode: 403,
        headers: { "Content-Type": "text/plain" },
        body: "403 - Forbidden",
      });
      return;
    }

    // body
    // uuid: string, replyId: string, type: booelan, newsId: string

    const body = JSON.parse(event.body);
    // 먼저 uuid를 통해 해당 댓글에 대해 점수를 부여한적이 있는지 체크 합니다.
    const isScored = await newsReplyScore.count({
      where: { createdUuid: body.createdUuid, newsReplyId: body.newsReplyId },
    });
    if (isScored > 0) {
      callback(null, {
        statusCode: 304,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Duplicate request" }),
      });
      return;
    }

    // news 스코어 조정
    await newsReply.update(
      { score: db.sequelize.literal(`score ${body.type ? "+" : "-"} 1`) },
      { where: { id: body.newsReplyId } }
    );
    // 내용 저장
    const save = await newsReplyScore.create(body);

    await callback(null, {
      statusCode: 201,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(save),
    });
  } catch (e) {
    callback(e);
  }
};

module.exports.getReplyScoreCnt = async function (event, context, callback) {
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
