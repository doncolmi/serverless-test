"use strict";
const axios = require("axios");
const cheerio = require("cheerio");

module.exports.hello = async (event) => {
  const { data } = await axios.get(
    "https://www.bbc.com/sport/football/premier-league"
  );
  const $ = cheerio.load(data);
  const list = $("div.sp-qa-top-stories")
    .children("div.gel-layout__item")
    .find("h3");
  const listArray = list.toArray().map((element) => $(element).text());

  const config = {
    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    "X-Naver-Client-Id": "GxtkDmY2t5Hra3AV3iYW",
    "X-Naver-Client-Secret": "33f3fAAojj",
  };

  for (const item of listArray) {
    console.log(item);
  }

  let i = 0;
  const TransTextArray = await listArray.map(async (element) => {
    console.log(`번역중! ${++i}/10`);
    const { data } = await axios({
      method: "POST",
      headers: config,
      url: `https://openapi.naver.com/v1/papago/n2mt?source=en&target=ko&text=${element}`,
    }).catch((e) => console.log(e));
    console.log(data);
    return data;
  });

  for (const item of TransTextArray) {
    console.log(item);
  }
  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        message: "Go Serverless v1.0! Your function executed successfully!",
        input: event,
      },
      null,
      2
    ),
  };
};
