"use strict";
const axios = require("axios");
const cheerio = require("cheerio");

module.exports.hello = async (event) => {
  const app_key = "04e720df504f317519965123d03df7d7";
  const config = {
    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    Authorization: `KakaoAK ${app_key}`,
  };
  const translate = async (text) => {
    const { data } = await axios({
      method: "GET",
      headers: config,
      url: `https://dapi.kakao.com/v2/translation/translate?src_lang=en&target_lang=kr&query=${text}`,
    });
    console.log(data.translated_text[0][0]);
    return data.translated_text[0][0];
  };

  const { data } = await axios.get(
    "https://www.bbc.com/sport/football/premier-league"
  );
  const $ = cheerio.load(data);
  const list = $("div.sp-qa-top-stories")
    .children("div.gel-layout__item")
    .find("h3");
  const listArray = list.toArray().map((item) => {
    const text = $(item).text();
    return {
      text: text,
      href: `https://www.bbc.com${$(item).parent().attr("href")}`,
      translated_text: translate(text),
    };
  });

  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        message: listArray[0].translated_text,
        input: event,
      },
      null,
      2
    ),
  };
};