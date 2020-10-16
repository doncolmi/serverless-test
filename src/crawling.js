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
          description = $("p").slice(0, 1).text();
        } else {
          description = item.description[0];
        }

        const translationText = await doTanslate([title, description]);

        const newsData = {
          title: title,
          translatedTitle: translationText[0],
          description:
            press.name === "가디언" && translationText[1].length > 300
              ? translationText[1]
              : `${translationText[1].slice(0, 300)}...`,
          date: new Date(item.pubDate[0]),
          topic: "해외 축구",
          tag: `${press.name}|AI번역`,
          href: href,
        };

        if (press.name === "Goal") {
          // image crawling
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
