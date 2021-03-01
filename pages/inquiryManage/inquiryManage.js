// pages/inquiryManage/inquiryManage.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    userInfoList: [],
    infoData:{}
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let obj = JSON.parse(options.data)
    this.setData({
      infoData: JSON.parse(wx.getStorageSync('chatInfo'))
    })
    let list=[{
      name: obj.doctorInfo.doctorName,
      avatar: obj.doctorInfo.faceImage,
      title:obj.doctorTitleName,
      type: 'doctor'
    }, {
      name: obj.assistantInfo.doctorName,
      avatar: obj.assistantInfo.faceImage,
      title:obj.assistTitleName,
      type: 'assistant'
    }, {
      name: obj.patientInfo.patientName,
      avatar: obj.patientInfo.faceImage,
      title:'',
      type: 'patient'
    }]
    this.setData({
      userInfoList:list
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
  // 跳转到用户或者医生主页
  userInfoClick(e) {
    let type = e.currentTarget.dataset.userinfo.type
    console.log(type)
    if(type === "doctor") {
      wx.navigateTo({
        url: `../doctorInfo/doctorInfo?info=${JSON.stringify(this.data.infoData.doctor)}`,
      })
    }else if(type === "assistant") {
      wx.navigateTo({
        url: `../doctorInfo/doctorInfo?info=${JSON.stringify(this.data.infoData.assistant)}`,
      })
    }else if(type === "patient") {
      this.setData({
        ['infoData.tmcPatient.faceImage']: this.data.infoData.patient.faceImage
      })
      wx.navigateTo({
        url: `../personInfo/personInfo?patientInfo=${JSON.stringify(this.data.infoData.tmcPatient)}&goChat=''&item={}`,
      })
    }
  }
})