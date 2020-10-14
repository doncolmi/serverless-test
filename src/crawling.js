"use strict";
const axios = require("axios");
const cheerio = require("cheerio");
const uuid = require("uuid4");

const db = require("./config/db");
const { kakao, aws, awsSecret } = require("./config/env.json")["development"];
const news = require("./models/news")(db.sequelize, db.Sequelize);
const newsScore = require("./models/newsScore")(db.sequelize, db.Sequelize);
const newsContents = require("./models/newsContents")(
  db.sequelize,
  db.Sequelize
);

const AWS = require("aws-sdk");
const image = require("imagemin");
const webp = require("imagemin-webp");

const s3 = new AWS.S3({
  accessKeyId: aws,
  secretAccessKey: awsSecret,
  region: "ap-northeast-2",
});

const {
  succesCallback,
  failCallback,
} = require("./middleware/callbackMiddleware");

function errorCallback(e) {
  console.log(e);
  const errorText = "Couldn't create News";
  failCallback(callback, e.statusCode, errorText, e);
}

module.exports.bbcFootBall = async (event, context, callback) => {
  const config = {
    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    Authorization: `KakaoAK ${kakao}`,
  };

  function calculatedDate(dateString) {
    const nowTime = new Date();
    const lastChar = dateString[dateString.length - 1];
    const time = dateString.slice(0, -1) * 1;
    if (lastChar === "h") nowTime.setHours(nowTime.getHours() - time);
    else if (lastChar === "m") nowTime.setMinutes(nowTime.getMinutes() - time);
    else if (lastChar === "d") nowTime.setDate(nowTime.getDate() - time);
    return nowTime;
  }

  async function translate(text) {
    const enText = encodeURI(text.replace("&", "and"));
    const { data } = await axios({
      method: "GET",
      headers: config,
      url: `https://dapi.kakao.com/v2/translation/translate?src_lang=en&target_lang=kr&query=${enText}`,
    });
    return data.translated_text[0][0];
  }

  const bbclink = [
    { link: "https://www.bbc.com/sport/football/premier-league", topic: "EPL" },
    { link: "https://www.bbc.com/sport/football/european", topic: "유럽 축구" },
  ];

  try {
    let udtCnt = 0;
    let errCnt = 0;
    for (const site of bbclink) {
      const { data } = await axios.get(site.link).catch((e) => {
        errorCallback(e);
      });

      const $ = cheerio.load(data);

      const list = $("div.sp-qa-top-stories")
        .children("div.gel-layout__item")
        .find("div.gs-c-promo")
        .toArray();

      for (const element of list) {
        const newsElem = $(element);
        const textElem = newsElem.find("div.gs-c-promo-body");
        const pictureElem = newsElem
          .find("img.qa-lazyload-image")
          .attr("data-src")
          .replace("{width}", "480");
        const href = `https://www.bbc.com${textElem
          .find("a.gs-c-promo-heading")
          .attr("href")}`;
        if ((await news.count({ where: { href: href } })) > 0) continue;
        const title = textElem.find("h3").text();

        // image crawling
        const { data } = await axios({
          url: pictureElem,
          responseType: "arraybuffer",
        });

        const imageTrans = await image.buffer(data, {
          plugins: [webp({ quality: 75 })],
        });

        const key = `${uuid()}.webp`;

        const s3Params = {
          Bucket: "thegreen-limc",
          Key: key,
          ContentType: "image/webp",
          ACL: "public-read",
          Body: imageTrans,
        };

        await s3.upload(s3Params).promise();

        const newsData = {
          href: href,
          title: title,
          translatedTitle: await translate(title),
          date: calculatedDate(
            textElem.find("span.qa-status-date-output").text()
          ),
          topic: site.topic,
          tag: "BBC|해외뉴스|AI번역",
          thumbnail: key,
        };

        news
          .create(newsData)
          .then(({ dataValues }) => {
            newsContents.create({ newsId: dataValues.id });
            udtCnt++;
          })
          .catch((err) => {
            errCnt++;
            console.log("couldn't save News, Error : ", err.message);
          });
      }
    }

    succesCallback(
      callback,
      200,
      `${udtCnt}개의 뉴스 업데이트, ${errCnt}개의 에러`,
      true
    );
  } catch (e) {
    errorCallback(e);
  }
};

module.exports.skyFootBall = async (event, context, callback) => {
  const config = {
    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    Authorization: `KakaoAK ${kakao}`,
  };

  function calculatedDate(date) {
    const ampm = date.slice(date.length - 2);
    const time = date
      .slice(date.length - 7, date.length - 2)
      .trim()
      .split(":");
    const day = date.slice(0, 8).split("/");
    if (time[0] === "12") {
      ampm === "am" ? (time[0] = 0) : (time[0] = 12);
    } else if (ampm === "pm") time[0] = time[0] * 1 + 12;
    const newDate = new Date(
      2000 + day[2] * 1,
      day[1] * 1 - 1,
      day[0],
      time[0],
      time[1],
      0,
      0
    );
    newDate.setHours(newDate.getHours() + 8);
    return newDate;
  }
  async function translate(text) {
    const enText = encodeURI(text.replace("&", "and"));
    const { data } = await axios({
      method: "GET",
      headers: config,
      url: `https://dapi.kakao.com/v2/translation/translate?src_lang=en&target_lang=kr&query=${enText}`,
    });
    return data.translated_text[0][0];
  }

  try {
    const { data } = await axios
      .get(`https://www.skysports.com/football/news`)
      .catch((e) => {
        errorCallback(e);
      });

    const $ = cheerio.load(data);

    const list = $("div.news-list").children("div.news-list__item").toArray();

    let udtCnt = 0;
    let errCnt = 0;

    for (const element of list) {
      const newsElem = $(element);
      const textElem = newsElem.find("div.news-list__body");
      const pictureElem = newsElem.find("img").attr("data-src").split("?")[0];
      const href = textElem.find("a.news-list__headline-link").attr("href");
      if ((await news.count({ where: { href: href } })) > 0) continue;
      const title = textElem.find("h4.news-list__headline").text().trim();

      // image crawling
      const { data } = await axios({
        url: pictureElem,
        responseType: "arraybuffer",
      });

      const imageTrans = await image.buffer(data, {
        plugins: [webp({ quality: 75 })],
      });

      const key = `${uuid()}.webp`;

      const s3Params = {
        Bucket: "thegreen-limc",
        Key: key,
        ContentType: "image/webp",
        ACL: "public-read",
        Body: imageTrans,
      };

      await s3.upload(s3Params).promise();

      const newsData = {
        href: href,
        title: title,
        translatedTitle: await translate(title),
        date: calculatedDate(textElem.find("span.label__timestamp").text()),
        topic: textElem.find("a.label__tag").text(),
        tag: "Sky|해외뉴스|AI번역",
        thumbnail: key,
      };

      news
        .create(newsData)
        .then(({ dataValues }) => {
          newsContents.create({ newsId: dataValues.id });
          udtCnt++;
        })
        .catch((err) => {
          errCnt++;
          console.log("couldn't save News, Error : ", err.message);
        });
    }
    succesCallback(
      callback,
      200,
      `${udtCnt}개의 뉴스 업데이트, ${errCnt}개의 에러`,
      true
    );
  } catch (e) {
    errorCallback(e);
  }
};

module.exports.goalFootBall = async (event, context, callback) => {
  let isYesterday = 0;
  let prevHour = 999;

  const config = {
    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    Authorization: `KakaoAK ${kakao}`,
  };

  async function translate(text) {
    const enText = encodeURI(text.replace("&", "and"));
    const { data } = await axios({
      method: "GET",
      headers: config,
      url: `https://dapi.kakao.com/v2/translation/translate?src_lang=en&target_lang=kr&query=${enText}`,
    });
    return data.translated_text[0][0];
  }

  function calculatedDate(date) {
    const now = new Date();
    const dateString = date.split(" ")[0].split(":");
    const hour = dateString[0] * 1;
    if (hour > now.getHours() && isYesterday === 0) isYesterday--;
    else if (prevHour === 0 && hour === 23) isYesterday--;
    now.setDate(now.getDate() + isYesterday);
    now.setHours(hour + 8);
    now.setMinutes(dateString[1] * 1);
    prevHour = hour;
    return now;
  }

  try {
    const { data } = await axios
      .get("https://www.goal.com/en/news/1")
      .catch((e) => {
        errorCallback(e);
      });

    const $ = cheerio.load(data);

    const list = $("table.widget-news-card")
      .children("tbody")
      .find("tr")
      .toArray();
    prevHour =
      $(list[0])
        .find("div.widget-news-card__date")
        .text()
        .trim()
        .split(" ")[0]
        .split(":")[0] * 1;
    let udtCnt = 0;
    let errCnt = 0;
    for (const element of list) {
      const newsElem = $(element);
      const textElem = newsElem.find("td.widget-news-card__content");
      const pictureElem = newsElem
        .find("td.widget-news-card__image > a > img")
        .attr("src")
        .split("?")[0];
      const href = `https://www.goal.com${textElem
        .find("a")
        .attr("href")
        .replace("http://www.goal.com", "")
        .replace("https://www.goal.com", "")}`;
      if ((await news.count({ where: { href: href } })) > 0) continue;
      const title = textElem.find("h3").attr("title");

      // image crawling
      const { data } = await axios({
        url: pictureElem,
        responseType: "arraybuffer",
      });

      const imageTrans = await image.buffer(data, {
        plugins: [webp({ quality: 75 })],
      });

      const key = `${uuid()}.webp`;

      const s3Params = {
        Bucket: "thegreen-limc",
        Key: key,
        ContentType: "image/webp",
        ACL: "public-read",
        Body: imageTrans,
      };

      await s3.upload(s3Params).promise();

      const newsData = {
        href: href,
        title: title,
        translatedTitle: await translate(title),
        date: calculatedDate(
          textElem.find("div.widget-news-card__date").text().trim()
        ),
        topic: textElem
          .find("a.widget-news-card__category")
          .attr("title")
          .trim(),
        tag: "Goal|해외뉴스|AI번역",
        thumbnail: key,
      };
      news
        .create(newsData)
        .then(({ dataValues }) => {
          newsContents.create({ newsId: dataValues.id });
          udtCnt++;
        })
        .catch((err) => {
          errCnt++;
          console.log("couldn't save News, Error : ", err.message);
        });
    }

    succesCallback(
      callback,
      200,
      `${udtCnt}개의 뉴스 업데이트, ${errCnt}개의 에러`,
      true
    );
  } catch (e) {
    errorCallback(e);
  }
};

// todo: 이제
