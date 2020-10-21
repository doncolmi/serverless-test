const { sequelize, Sequelize } = require("./models");
const user = require("./models/user/user")(sequelize, Sequelize);
const userSet = require("./models/user/userSet")(sequelize, Sequelize);

const axios = require("axios");
const uuid = require("uuid4");

/**
 * get : loginUser
 * @author doncolmi <daeseong0226@gmail.com>
 * @param {Object[]} event - Contains the request information
 * @param {string} event.Authorization - token for kakao
 * @return {JSON} - userInfo
 */
module.exports.login = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;

  const token = event.headers.Authorization;
  const tokenHeader = { Authorization: token };
  const url = `https://kapi.kakao.com/v1/user/access_token_info`;
  const { data } = await axios.get(url, { headers: tokenHeader }).catch((e) => {
    callback(e);
  });

  if (data.id) {
    const getUser = await user.findOrCreate({
      where: { uuid: data.id },
      defaults: { name: uuid().split("-")[0], createdUuid: data.id },
    });
    const userInfo = getUser[0].dataValues;
    const isJoin = getUser[1];
    const getUserSet = await userSet.findOrCreate({
      where: { uuid: data.id },
      defaults: { uuid: data.id },
    });
    const userSetInfo = getUserSet[0].dataValues;
    await callback(null, {
      statusCode: isJoin ? 201 : 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...userInfo, ...userSetInfo }),
    });
  } else {
    callback(e);
  }
};

/**
 * get : check duplicate and Validation Nickname
 * @author doncolmi <daeseong0226@gmail.com>
 * @param {string} name - The name of the user want to change
 * @return {boolean} - isDuplicate?
 */
module.exports.chkName = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    const name = event.queryStringParameters.name;
    if (!event.headers.Authorization) {
      callback(null, {
        statusCode: 403,
        headers: { "Content-Type": "text/plain" },
        body: "403 - Forbidden",
      });
      return;
    }
    const regExp = /^[가-힣a-zA-Z0-9]{2,8}$/;

    const validation = regExp.test(name);
    const isNotDuplicate = (await user.count({ where: { name: name } })) < 1;
    callback(null, {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validation && isNotDuplicate),
    });
  } catch (e) {
    callback(e);
  }
};

/**
 * patch : change Nickname
 * @author doncolmi <daeseong0226@gmail.com>
 * @param {Object[]} event - Contains the request information
 * @param {string} event.Authorization - token for kakao
 * @param {string} event.body.name - The name of the user want to change
 * @return {boolean} - isChange?
 */
module.exports.chgName = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;
  try {
    const { name } = JSON.parse(event.body);
    const token = event.headers.Authorization;
    const tokenHeader = { Authorization: token };
    const url = `https://kapi.kakao.com/v1/user/access_token_info`;
    const { data } = await axios.get(url, { headers: tokenHeader });

    const getUser = await user.findOne({ where: { uuid: data.id } });
    const getUserSetting = await userSet.findOne({ where: { uuid: data.id } });

    if (getUser && getUserSetting) {
      const changeTime = getUserSetting.isChangeName ? 7889400000 : 259200000;
      console.log(changeTime);
      const modifiedDate = new Date(getUser.modifiedDate);
      const diffTime = new Date().getTime() - modifiedDate.getTime();

      if (diffTime > changeTime) {
        await user.update(
          { name: name, modifiedDate: new Date(), modifiedUuid: data.id },
          { where: { uuid: data.id } }
        );
        await userSet.update(
          {
            isChangeName: true,
            modifiedDate: new Date(),
            modifiedUuid: data.id,
          },
          { where: { uuid: data.id } }
        );
        await callback(null, {
          statusCode: 200,
          headers: { "Content-Type": "text/plain" },
          body: "닉네임이 변경되었습니다!",
        });
      } else {
        // 이름을 바꿀 수 있는 시간 계산
        const time = new Date(
          modifiedDate.setTime(modifiedDate.getTime() + changeTime)
        );
        await callback(null, {
          statusCode: 406,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date: time }),
        });
      }
    } else {
      callback(null, {
        statusCode: 403,
        headers: { "Content-Type": "text/plain" },
        body: "403 - Forbidden",
      });
    }
  } catch (e) {
    callback(e);
  }
};

/**
 * delete : exit user
 * @author doncolmi <daeseong0226@gmail.com>
 * @param {Object[]} event - Contains the request information
 * @param {string} event.Authorization - token for kakao
 * @return {boolean} - isDelete?
 */
module.exports.ExitUser = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    const token = event.headers.Authorization;
    const tokenHeader = { Authorization: token };
    const url = `https://kapi.kakao.com/v1/user/access_token_info`;
    const { data } = await axios.get(url, { headers: tokenHeader });

    const getUser = await user.destroy({ where: { uuid: data.id } });

    if (getUser > 0) {
      callback(null, {
        statusCode: 200,
        headers: { "Content-Type": "text/plain" },
        body: "회원 탈퇴가 완료되었습니다!",
      });
    } else {
      callback(null, {
        statusCode: 400,
        headers: { "Content-Type": "text/plain" },
        body: "회원 탈퇴 오류입니다. 관리자에게 문의해주세요.",
      });
    }
  } catch (e) {
    callback(e);
  }
};
