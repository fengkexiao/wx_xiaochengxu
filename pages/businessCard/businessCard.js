const app = getApp();
const HTTP = require('./../../utils/http-util');

Page({
  /**
   * 页面的初始数据
   */
  data: {
    info:{},
    doctorInfo:{}
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.setData({
      info: JSON.parse(options.info)
    })
    this.getQr()
  },
  /**
   * 获取二维码
   */
  getQr() {
    let params = {
      assistantStaffID: app.globalData.userInfo.assistantStaffID
    }
    wx.showLoading({
      title: '加载中...'
    });
    HTTP.getAssistantQR(params).then(res => {
      wx.hideLoading();
      if (res.code === 0) {
        this.setData({
          doctorInfo: res.data
        })
      }
    }).catch(() => {
      wx.hideLoading();
    });
  }
})