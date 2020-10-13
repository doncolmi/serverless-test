"use strict";
const AWS = require("aws-sdk");
const fs = require("fs");
const axios = require("axios");
const image = require("imagemin");
const webp = require("imagemin-webp");

module.exports.s3upload = async (event, context, callback) => {
  const s3 = new AWS.S3({
    accessKeyId: "",
    secretAccessKey: "",
    region: "ap-northeast-2",
  });
  const url = [
    "https://images.daznservices.com/di/library/GOAL/3c/d2/rodrygo-real-madrid-2019-20_1krmc78bpasvi1jiabf3i0m18b.jpg?",
  ];

  image(url, "images", {
    use: [webp({ quality: 75 })],
  }).then((result) => console.log(result));

  // const s3Params = {
  //     Bucket: 'thegreen-limc',
  //     Key: "test.jpg",
  //     ContentType: "image/jpeg",
  //     ACL: 'public-read',
  //     Body: data
  // }

  // const hi = await s3.upload(s3Params, function (err, data) { console.log(err); console.log(data);})
  // console.log(hi);
};
