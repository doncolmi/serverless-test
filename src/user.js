"use strict";

const crypto = require("crypto");

const { secretKey, mail_id, mail_pw } = require("./config/env.json")[
  "development"
];
const db = require("./config/db");
const user = require("./models/user")(db.sequelize, db.Sequelize);
const userSetting = require("./models/userSet")(db.sequelize, db.Sequelize);
const uuid4 = require("uuid4");
const nodemailer = require("nodemailer");

const Ajv = require("ajv");
const ajv = Ajv({ allErrors: true });
const userSchema = require("./validation/create.json");

const {
  succesCallback,
  failCallback,
} = require("./middleware/callbackMiddleware");

module.exports.syncUser = async function (event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    await user.sync();
    await userSetting.sync();
    await succesCallback(callback, 201, "Created!", true);
  } catch (e) {
    console.log(e);
    const errorText = "Couldn't create the order, Error inserting into DB";
    await failCallback(callback, e.statusCode, errorText, e);
  }
};

module.exports.createUser = async function (event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  const data = JSON.parse(event.body);
  const salt = crypto.randomBytes(64).toString("base64");

  function setPassword(password, salt) {
    const dc = crypto.createDecipheriv("aes-256-gcm", secretKey, secretKey);
    const dcPw = dc.update(password, "base64", "utf-8");
    const cryptoPw = crypto.pbkdf2Sync(dcPw, salt, 108362, 64, "sha512");
    return cryptoPw.toString("base64");
  }

  // set uuid, salt, pwd
  data.uuid = (() => {
    const tokens = uuid4().split("-");
    return tokens[2] + tokens[1] + tokens[0] + tokens[3] + tokens[4];
  })();
  data.salt = salt;
  data.pwd = setPassword(data.pwd, salt);
  data.createdUuid = data.uuid;

  const valid = ajv.validate(userSchema, data);
  if (!valid) {
    console.error("Validation Failed");
    callback(null, {
      statusCode: 400,
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify(ajv.errors[0].message),
    });
  }

  try {
    await user.create(data);
    await userSetting.create({ uuid: data.uuid });
    const config = {
      service: "gmail",
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: mail_id,
        pass: mail_pw,
      },
    };
    const mailInfo = {
      from: `Soccer ${mail_id}`,
      to: data.email,
      subject: "Soccer 인증 메일입니다.",
      text: "wow...!",
      html: `<a href="http://localhost:3000/dev/v1/user/auth">아이디 인증 하기</a>`,
    };
    const mail = nodemailer.createTransport(config);
    mail.sendMail(mailInfo);
    await succesCallback(callback, 201, "Created!", true);
  } catch (e) {
    console.log(e);
    const errorText = "Couldn't create the order, Error inserting into DB";
    await failCallback(callback, e.statusCode, errorText, e);
  }
};
