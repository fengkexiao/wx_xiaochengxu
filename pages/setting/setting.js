Page({

  /**
   * 页面的初始数据
   */
  data: {
    name: '',
    phone: '',
    info: {}
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let info = JSON.parse(options.info)
    info.staffID = info.keyID
    let phone = info.phone;
    var reg = /^(\d{3})\d{4}(\d{4})$/;
    phone = phone.replace(reg, "$1****$2");
    this.setData({
      name: info.staffName,
      phone: phone,
      info: info
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },


  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  },
  /**
   * 医生详情页
   */
  handleGoInfo() {
    wx.navigateTo({
      url: `/pages/doctorInfo/doctorInfo?info=${JSON.stringify(this.data.info)}`,
    })
  },
  /**
   * 医生详情页
   */
  handleGoWeb(event) {
    let url = ''; // 跳转的外链
    let navtitle = ''; // 这个标题是你自己可以设置的
    if (event.currentTarget.dataset.type === "1") {
      url = 'https://apph5.100cbc.com/doctor/cloudOfficeAgreement.html'
      navtitle = '注册协议'
    } else {
      url = 'https://apph5.100cbc.com/doctor/cloudOfficeStatement.html '
      navtitle = '隐私政策'
    }
    wx.navigateTo({
      // 跳转到webview页面
      url: `/pages/webview/webview?url=${url}&nav=${navtitle}`,
    });
  }
})