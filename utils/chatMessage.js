const moment = require("moment");

const formatMessage = (data) => {
  const msg = {
    from: data.fromUser,
    to: data.toUser,
    message: data.msg,
    date: moment().format("YYYY-MM-DD"),
    time: moment().format("hh:mm a"),
    bookId: data.bookId, // Include the bookId in the message object
  };
  return msg;
};
module.exports = formatMessage;