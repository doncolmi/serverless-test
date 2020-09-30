const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const { secretKey, mail_id, mail_pw } = require("../src/config/env.json")[
  "development"
];

const mockUser = {
  uuid: "4896d3b55a0fcf5bbd87e8f902940fcb",
  email: mail_id,
  name: "대성",
  pwd:
    "X0SMlDwY5v557qMiU0elH7NXhLU3oCPxDFR1qb6MDsJziCajK1qRwsevK73P4qZmCWpa3mfnccxYi9725qm4QQ==",
  salt:
    "Zxz3e+IaWOos/kogS0r2B1TJ03KZmQujs61Euq3PtBzFXrV773fb5gOC1Lu8zx0Vt1WFAD/tREU3+yP/b8yHmQ==",
};

test("encrypt", () => {
  const password = "HelloGuys";
  const cipher = crypto.createCipheriv("aes-256-gcm", secretKey, secretKey);
  const encryptPassword = cipher.update(password, "utf-8", "base64");
  const dc = crypto.createDecipheriv("aes-256-gcm", secretKey, secretKey);
  const dcPw = dc.update(encryptPassword, "base64", "utf-8");
  expect(dcPw).toEqual(password);
});

test("getSalt", () => {
  const salt = crypto.randomBytes(64);
  expect(salt.length).toEqual(64);
});

test("login", () => {
  function setPassword(password, salt) {
    const dc = crypto.createDecipheriv("aes-256-gcm", secretKey, secretKey);
    const dcPw = dc.update(password, "base64", "utf-8");
    const cryptoPw = crypto.pbkdf2Sync(dcPw, salt, 108362, 64, "sha512");
    return cryptoPw.toString("base64");
  }
  const mockLoginData = {
    email: "matathresh1740@naver.com",
    pwd: "URf8IIhKA/Q+",
  };
  const getUser =
    mockUser.email === mockLoginData.email ? mockUser : expect(1).toEqual(2);
  const pwdForCheck = setPassword(mockLoginData.pwd, getUser.salt);
  expect(getUser.pwd === pwdForCheck).toEqual(true);
});

test("aboutJWT", () => {
  try {
    const payload = {
      uuid: mockUser.uuid,
      name: mockUser.name,
    };
    const option = {
      expiresIn: "5h",
      issuer: "soccer",
      subject: "user",
    };
    const token = jwt.sign(payload, secretKey.toString("base64"), option);
    console.log(`token : `, token);
    const verify = jwt.verify(token, secretKey);
    expect(verify.uuid).toEqual(mockUser.uuid);
  } catch (e) {
    console.log(e);
    expect(0).toEqual(1);
  }
});

test("sendMail", async () => {
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
    to: "matathresh1740@naver.com",
    subject: "Hello guys",
    text: "wow...!",
    html: `<h3>lol...</h3>`,
  };
  try {
    const mail = nodemailer.createTransport(config);
    const send = await mail.sendMail(mailInfo);
    expect(1).toEqual(1);
  } catch (e) {
    console.log(e);
    expect(0).toEqual(1);
  }
});
