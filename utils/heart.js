const appGlobalData = getApp().globalData;
const HTTP = require('./http-util')
/**
 * 心跳
 */
exports.heartFun = function (pageName, path, videoMaterialSrc) {
  // try {
  //   if (pageName === '院长详情页') {
  //     if (videoMaterialSrc === 'https://res.100cbc.com/tmc/hospital/2381/hosDetail.html') {
  //       pageName = '医院详情页'
  //     }
  //   }
  //   if (wx.getStorageSync('personInfo').keyID) {
  //     HTTP.heart({
  //         patientID: wx.getStorageSync('personInfo').keyID,
  //         path: path,
  //         channelCode: "tmcpro",
  //         channelName: "小程序",
  //         pathName: pageName || ''
  //       })
  //       .then(res => {

  //       }).catch(e => {
  //         console.error(e)
  //       })
  //   }
  // } catch (error) {
  //   console.error(error)
  // }
}

exports.intervalTime = 2000