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
    return nowTime.toString();
  }
  async function translate(text) {
    const { data } = await axios({
      method: "GET",
      headers: config,
      url: `https://dapi.kakao.com/v2/translation/translate?src_lang=en&target_lang=kr&query=${text}`,
    });
    return data.translated_text[0][0];
  }
  try {
    const { data } = await axios.get("https://www.bbc.com/sport/football");
    const $ = cheerio.load(data);
    const list = $("div.sp-qa-top-stories")
      .children("div.gel-layout__item")
      .find("div.gs-c-promo-body");
    list.toArray().map(async (element) => {
      const data = {};
      const newsElem = $(element);
      data.href = `https://www.bbc.com${newsElem
        .find("a.gs-c-promo-heading")
        .attr("href")}`;
      if ((await news.count({ where: { href: data.href } })) > 0) return "";
      data.title = newsElem.find("h3").text();
      data.translatedTitle = await translate(data.title);
      data.date = calculatedDate(
        newsElem.find("span.qa-status-date-output").text()
      );
      data.topic = newsElem.find("span.gs-o-section-tag > a").text();
      data.tag = "BBC";
      news.create(data);
    });
    await succesCallback(callback, 200, "created News!", true);
  } catch (e) {
    console.log(e);
    const errorText = "Couldn't create News";
    await failCallback(callback, e.statusCode, errorText, e);
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
    newDate.setHours(newDate.getHours() + 9);
    return newDate.toString();
  }
  async function translate(text) {
    const { data } = await axios({
      method: "GET",
      headers: config,
      url: `https://dapi.kakao.com/v2/translation/translate?src_lang=en&target_lang=kr&query=${text}`,
    });
    return data.translated_text[0][0];
  }
  try {
    const { data } = await axios.get("https://www.skysports.com/football/news");
    const $ = cheerio.load(data);
    const list = $("div.news-list")
      .children("div.news-list__item")
      .find("div.news-list__body");
    list.toArray().map(async (element) => {
      const data = {};
      const newsElem = $(element);
      data.href = newsElem.find("a.news-list__headline-link").attr("href");
      if ((await news.count({ where: { href: data.href } })) > 0) return "";
      data.title = newsElem.find("h4.news-list__headline").text().trim();
      data.translatedTitle = await translate(data.title);
      data.date = calculatedDate(newsElem.find("span.label__timestamp").text());
      data.topic = newsElem.find("a.label__tag").text();
      data.tag = "SkySports";
      news.create(data);
    });
    await succesCallback(callback, 200, "created News!", true);
  } catch (e) {
    console.log(e);
    const errorText = "Couldn't create News";
    await failCallback(callback, e.statusCode, errorText, e);
  }
};
