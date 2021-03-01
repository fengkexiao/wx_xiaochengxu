// pages/online-inquiry/inquiry/videoPlay/videoPlay.js
const commonFun = require('../../../../utils/common.js');
Page({

  /**
   * 页面的初始数据
   */
  data: {
    materialInfo: {
      materialType: -1, // 0:图文 1:图片 2:视频
      title: "", // 标题
      descrip: "", // 描述
      videoMaterialSrc: "", // 视频文件路径
      posterSrc: "" // 视频封面图路径
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    let that = this;
    let acceptOptions = JSON.parse(options.materialData); // 接收数组、对象转换的字符窜时，需要把格式转换回来
    // if (acceptOptions.title && acceptOptions.title.length > 0) {
    //   wx.setNavigationBarTitle({
    //     title: acceptOptions.title
    //   });
    // } else {
    //   wx.setNavigationBarTitle({
    //     title: "素材展示"
    //   });
    // }
    if (acceptOptions.materialType || acceptOptions.materialType == 0) {
      // let newUrl = decodeURIComponent(acceptOptions.url);
      // let newLogoUrl = decodeURIComponent(acceptOptions.logoUrl);
      that.setData({
        materialInfo: {
          title: (acceptOptions.title && acceptOptions.title.length > 0) ? acceptOptions.title : "素材展示",
          descrip: acceptOptions.descrip,
          videoMaterialSrc: acceptOptions.url,
          posterSrc: acceptOptions.logoUrl,
          materialType: acceptOptions.materialType
        }
      });
      if (acceptOptions.materialType == 0) {
        // 图文素材
      } else if (acceptOptions.materialType == 2) {
        // 视频素材
        if (!acceptOptions.url) {
          wx.showToast({
            title: "视频素材链接地址异常，无法正常播放",
            icon: "warn",
            duration: 3000
          });
        }
      }
    } else {
      wx.showToast({
        title: "素材数据异常，无法正常展示",
        icon: "warn",
        duration: 3000
      });
    }
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function() {
    this.videoContext = wx.createVideoContext("myVideo");
    // console.log(this.videoContext);
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function() {
    return commonFun.onShareAppMessageFun(); // 调用公共的分享配置
  },

  errorFun: function(e) {
    console.log("视频播放错误" + JSON.stringify(e));
    wx.showToast({
      title: "视频异常，无法正常播放",
      icon: "none",
      duration: 3000
    });
  }
})