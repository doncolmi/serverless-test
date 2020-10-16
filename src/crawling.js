"use strict";
const axios = require("axios");
const uuid = require("uuid4");
const xml = require("xml2js");
const cheerio = require("cheerio");
const { Translate } = require("@google-cloud/translate").v2;

const { sequelize, Sequelize } = require("./models");
const { aws, awsSecret } = require("./config/env.json")["development"];
const news = require("./models/news/news")(sequelize, Sequelize);
const newsContents = require("./models/news/newsContents")(
  sequelize,
  Sequelize
);

const AWS = require("aws-sdk");
const image = require("imagemin");
const webp = require("imagemin-webp");

module.exports.newsCrawling = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;

  const translate = new Translate();

  const s3 = new AWS.S3({
    accessKeyId: aws,
    secretAccessKey: awsSecret,
    region: "ap-northeast-2",
  });

  const presses = [
    { name: "Goal", url: "https://www.goal.com/feeds/en/news" },
    {
      name: "BBC",
      url: "http://feeds.bbci.co.uk/sport/football/rss.xml?edition=uk",
    },
    {
      name: "가디언",
      url: "https://feeds.theguardian.com/theguardian/football/rss",
    },
  ];

  async function doTanslate(text) {
    try {
      let [translations] = await translate.translate(text, "ko");
      translations = Array.isArray(translations)
        ? translations
        : [translations];
      return translations;
    } catch (e) {
      console.log(e);
      return ["", ""];
    }
  }

  try {
    let udtCnt = 0;
    let errCnt = 0;
    for (const press of presses) {
      const { data } = await axios.get(press.url);
      const xmlData = await xml.parseStringPromise(data);
      const itemList = xmlData.rss.channel[0].item;

      for (const item of itemList) {
        const href = item.link[0];
        if ((await news.count({ where: { href: href } })) > 0) continue;
        if (!href.includes("football") && !(press.name === "Goal")) continue;
        const day = new Date().getTime() - new Date(item.pubDate[0]).getTime();
        if (day > 86400000) continue;

        const title = item.title[0];
        let description;
        if (press.name === "가디언") {
          const $ = cheerio.load(item.description[0]);
          description = $("p").slice(0, 2).text();
        } else {
          description = item.description[0];
        }

        const translationText = await doTanslate([title, description]);

        let transDescription = translationText[1];
        if (press.name === "가디언" && translationText[1].length > 300) {
          transDescription = `${translationText[1].slice(0, 300)}...`;
        }

        const newsData = {
          title: title,
          translatedTitle: translationText[0],
          description: transDescription,
          date: new Date(item.pubDate[0]),
          topic: "해외 축구",
          tag: `${press.name}|AI번역`,
          href: href,
        };

        if (press.name === "Goal" && "media:content" in item) {
          const { data } = await axios({
            url: item["media:content"][0]["$"].url
              .split("?")[0]
              .replace("70x70", "768x432"),
            responseType: "arraybuffer",
          });

          const key = `${uuid()}.webp`;

          const imageTrans = await image.buffer(data, {
            plugins: [webp({ quality: 75 })],
          });

          const s3Params = {
            Bucket: "thegreen-limc",
            Key: key,
            ContentType: "image/webp",
            ACL: "public-read",
            Body: imageTrans,
          };

          await s3.upload(s3Params).promise();

          newsData.thumbnail = key;
          newsData.tag = `${press.name}|AI번역|사진`;
        } else if (press.name === "가디언") {
          newsData.topic = item["category"][0]["_"];
        }

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

    callback(null, {
      statusCode: 201,
      headers: { "Content-Type": "text/plain" },
      body: `${udtCnt}개의 뉴스 업데이트, ${errCnt}개의 에러`,
    });
  } catch (e) {
    callback(e);
  }
};

/** @description post goal.com crawling Contents
 * @param {string} url site url
 * @return {JSON}
 */
module.exports.goalContents = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;

  const translate = new Translate();

  async function doTanslate(text) {
    try {
      let [translations] = await translate.translate(text, "ko");
      translations = Array.isArray(translations)
        ? translations
        : [translations];
      return translations;
    } catch (e) {
      console.log(e);
      return [""];
    }
  }

  try {
    const newsId = event.pathParameters.newsId;
    const { url, tag } = JSON.parse(event.body);

    let contents;

    if (!url.includes("https://www.goal.com/en/news/")) {
      contents =
        "해당 기사는 영상 클립이거나 잘못된 링크를 가지고 있어 본문을 가져오지 못했습니다.";
    } else {
      const { data } = await axios.get(url).catch((e) => {
        errorCallback(e);
      });

      const $ = cheerio.load(data);
      const container = $(".page-container");
      const teaser = container.find(".teaser").text();
      const contentsArray = container.find("p").slice(0, 5).toArray();

      const transTeaser = await doTanslate(teaser);
      contents = `<div class="header"><p>${transTeaser}</p><p class="engSub">${teaser}</p></div>`;

      for (const content of contentsArray) {
        const text = $(content).text();
        const trans = await doTanslate(text);
        const forConcat = `<div class="pContent"><p>${trans}</p><p class="engSub">${text}</p></div>`;
        contents = contents.concat(forConcat);
      }

      const tagCon = `${tag}|본문등재`;

      await news.update(
        {
          tag: tagCon,
          modifiedDate: new Date(),
        },
        { where: { id: newsId } }
      );
    }

    const updated = await newsContents.update(
      { contents: contents, modifiedDate: new Date() },
      { where: { id: newsId } }
    );

    callback(null, {
      statusCode: 200,
      headers: { "Content-Type": "text/plain" },
      body: "well",
    });
  } catch (e) {
    callback(e);
  }
};
