let msgType = require("msgtype");
module.exports = function (sendableMsg, type, myName) {
  var msg = {};
  msg.type = type;
  if (type == msgType.TEXT) {
    //文本消息
    msg.data = sendableMsg;
  } else if (type == msgType.IMAGE) {
    //图片消息
    msg.data = sendableMsg;
  } else if (type == msgType.AUDIO) {
    //音频消息
    msg.data = sendableMsg;
  } else if (type == msgType.VIDEO) {
    //视频消息
    msg.data = sendableMsg;
  } else if (type == msgType.FILE) {
    //文件消息
    msg.data = sendableMsg;
  } else if (type == msgType.CUSTOM) {
    //自定义消息
    msg.data = sendableMsg;
  }
  return msg.data;
};