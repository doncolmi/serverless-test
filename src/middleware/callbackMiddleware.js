const textResponseHeaders = {
  "Content-Type": "text/plain",
};
const jsonResponseHeaders = {
  "Content-Type": "application/json",
};

module.exports.succesCallback = (callback, statusCode, body, isText) => {
  callback(null, {
    statusCode: statusCode,
    headers: isText ? textResponseHeaders : jsonResponseHeaders,
    body: body,
  });
};

module.exports.failCallback = (callback, statusCode, body, error) => {
  callback(null, {
    statusCode: statusCode || 501,
    headers: textResponseHeaders,
    body: `${body}, Error : ${error}`,
  });
};
