"use strict";
const AWS = require("aws-sdk");
const { aws, awsSecret } = require("./config/env.json")["development"];
const fs = require("fs");
const axios = require("axios");
const image = require("imagemin");
const webp = require("imagemin-webp");

module.exports.s3upload = async (event, context, callback) => {
  const s3 = new AWS.S3({
    accessKeyId: aws,
    secretAccessKey: awsSecret,
    region: "ap-northeast-2",
  });

  const url =
    "https://images.daznservices.com/di/library/GOAL/3c/d2/rodrygo-real-madrid-2019-20_1krmc78bpasvi1jiabf3i0m18b.jpg?";

  const { data } = await axios({
    url,
    responseType: "arraybuffer",
  });
  const hello = await image.buffer(data, {
    plugins: [webp({ quality: 75 })],
  });

  const s3Params = {
    Bucket: "thegreen-limc",
    Key: "test.webp",
    ContentType: "image/webp",
    ACL: "public-read",
    Body: hello,
  };

  const hi = await s3.upload(s3Params).promise();
  await callback(null, {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ wow: "hello" }),
  });
};
