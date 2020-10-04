"use strict";
const axios = require("axios");
const cheerio = require("cheerio");

const db = require("./config/db");
const { kakao } = require("./config/env.json")["development"];
const news = require("./models/news")(db.sequelize, db.Sequelize);

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
    const { data } = await axios({
      method: "GET",
      headers: config,
      url: `https://dapi.kakao.com/v2/translation/translate?src_lang=en&target_lang=kr&query=${text.replace(
        "&",
        "and"
      )}`,
    });
    return data.translated_text[0][0];
  }

  const bbclink = [
    { link: "https://www.bbc.com/sport/football/premier-league", topic: "EPL" },
    { link: "https://www.bbc.com/sport/football/european", topic: "유럽 축구" },
  ];

  try {
    bbclink.forEach(async (site) => {
      const { data } = await axios.get(site.link).catch((e) => {
        errorCallback(e);
      });

      const $ = cheerio.load(data);

      const list = $("div.sp-qa-top-stories")
        .children("div.gel-layout__item")
        .find("div.gs-c-promo-body");

      list.toArray().map(async (element) => {
        const newsElem = $(element);
        const href = `https://www.bbc.com${newsElem
          .find("a.gs-c-promo-heading")
          .attr("href")}`;
        if ((await news.count({ where: { href: href } })) > 0) return "";
        const title = newsElem.find("h3").text();
        const newsData = {
          href: href,
          title: title,
          translatedTitle: await translate(title),
          date: calculatedDate(
            newsElem.find("span.qa-status-date-output").text()
          ),
          topic: site.topic,
          tag: "BBC|번역제목",
        };
        news.create(newsData).catch((err) => {
          console.log("couldn't save News, Error : ", err.message);
        });
      });
    });
  } catch (e) {
    errorCallback(e);
  } finally {
    succesCallback(callback, 200, "created News!", true);
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
    if (time[0] === "12" && ampm === "pm") time[0] = 0;
    else if (ampm === "pm") time[0] = time[0] * 1 + 12;
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
    const { data } = await axios({
      method: "GET",
      headers: config,
      url: `https://dapi.kakao.com/v2/translation/translate?src_lang=en&target_lang=kr&query=${text.replace(
        "&",
        "and"
      )}`,
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

    const list = $("div.news-list")
      .children("div.news-list__item")
      .find("div.news-list__body");
    const hrefCheck = $(list[0])
      .find("a.news-list__headline-link")
      .attr("href");
    if ((await news.count({ where: { href: hrefCheck } })) > 0) {
      succesCallback(callback, 302, "There is no new news.", true);
      return;
    }

    list.toArray().map(async (element) => {
      const newsElem = $(element);
      const href = newsElem.find("a.news-list__headline-link").attr("href");
      if ((await news.count({ where: { href: href } })) > 0) return "";
      const title = newsElem.find("h4.news-list__headline").text().trim();
      const newsData = {
        href: href,
        title: title,
        translatedTitle: await translate(title),
        date: calculatedDate(newsElem.find("span.label__timestamp").text()),
        topic: newsElem.find("a.label__tag").text(),
        tag: "Sky|번역제목",
      };
      news.create(newsData).catch((err) => {
        console.log("couldn't save News, Error : ", err.message);
      });
    });
  } catch (e) {
    errorCallback(e);
  } finally {
    succesCallback(callback, 200, "created News!", true);
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
    const { data } = await axios({
      method: "GET",
      headers: config,
      url: `https://dapi.kakao.com/v2/translation/translate?src_lang=en&target_lang=kr&query=${text.replace(
        "&",
        "and"
      )}`,
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
      .find("td.widget-news-card__content")
      .toArray();
    prevHour =
      $(list[0])
        .find("div.widget-news-card__date")
        .text()
        .trim()
        .split(" ")[0]
        .split(":")[0] * 1;

    for (const element of list) {
      const newsElem = $(element);
      const href = `https://www.goal.com${newsElem
        .find("a")
        .attr("href")
        .replace("http://www.goal.com", "")
        .replace("https://www.goal.com", "")}`;
      if ((await news.count({ where: { href: href } })) > 0) break;
      const title = newsElem.find("h3").attr("title");
      const newsData = {
        href: href,
        title: title,
        translatedTitle: await translate(title),
        date: calculatedDate(
          newsElem.find("div.widget-news-card__date").text().trim()
        ),
        topic: newsElem
          .find("a.widget-news-card__category")
          .attr("title")
          .trim(),
        tag: "Goal|번역제목",
      };
      news.create(newsData).catch((err) => {
        console.log("couldn't save News, Error : ", err.message);
      });
    }
  } catch (e) {
    errorCallback(e);
  } finally {
    succesCallback(callback, 200, "created News!", true);
  }
};
