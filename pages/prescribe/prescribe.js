const app = getApp();
const HTTP = require('./../../utils/http-util');
Page({

  /**
   * 页面的初始数据
   */
  data: {
    patientInfo: {},
    diagnose: '',
    inquiryInfo:{}
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    if(options.data) {
      this.setData({
        inquiryInfo: JSON.parse(options.data)
      })
    }
    wx.removeStorageSync('diagnose')
    wx.removeStorageSync('drugList')
    let data = JSON.parse(wx.getStorageSync('chatInfo'))
    if(data && data.tmcPatient) {
      if(data.tmcPatient.birthYear !== 0)  {
        data.tmcPatient.age = this.getAnalysisIdCard(data.tmcPatient.birthYear, 3)
      }else {
        data.tmcPatient.age = ''
      }
      data.tmcPatient.modifyTime = ""
    }
    this.getRpInfoByInquiryID(data.tmcPatient)
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
  // 根据问诊ID查询处方
  getRpInfoByInquiryID(data) {
    wx.showLoading({
      title: '加载中...'
    });
    let params = {
      orgID: app.globalData.userInfo.orgID,
      inquiryID: this.data.inquiryInfo.keyID
    }
    HTTP.getRpInfoByInquiryID(params).then(res => {
      wx.hideLoading()
      if(res.code === 0) {
        if(res.data && res.data.rp) {
          res.data.rp.keyIDs = res.data.rp.keyID
          this.getPatientDoc(res.data.rp)
          wx.setStorageSync('drugList', JSON.stringify(res.data.rpMedicines))
        }else {
          data.patientID = data.keyID
          this.getPatientDoc(data)
        }
      }
    }).catch(() => {
      wx.hideLoading()
    })
  },
   // 获取患者档案
   getPatientDoc(data) {
    wx.showLoading({
      title: '加载中...'
    });
    let params = {
      orgID: data.orgID,
      keyID: data.patientID
    }
    HTTP.getPatientDoc(params).then(res =>{
      wx.hideLoading();
      if(res.code === 0) {
        let obj = {}
        res.data.forEach( ele => {
          if(ele.docItemCode === "ALLERGY") {
            obj.historyOfAllergy = ele.docItemDesc
          }else if(ele.docItemCode === "LIVER") {
            obj.liver = ele.docItemValue
          }else if(ele.docItemCode === "KIDNEY") {
            obj.renal = ele.docItemValue
          }else if(ele.docItemCode === "PREGNANCY" && data && data.sex === 2) {
            obj.pregnancy = ele.docItemValue
          }else if(ele.docItemCode === "ILLNESS") {
            obj.historyOfSickness = ele.docItemDesc
          }
        })
        this.setData({
          patientInfo: {...data, ...obj, inquiryInfo:{...this.data.inquiryInfo}}
        })
        wx.setStorageSync("patientInfo",JSON.stringify(this.data.patientInfo))
      }
    }).catch(() =>{
      wx.hideLoading();
    })
  },
  diagnoseInput(e) {
    this.setData({
      diagnose: e.detail.value
    })
  },
  // 下一步
  nextStep: function() {
    if(this.data.diagnose == "") {
      wx.showToast({
        title: '请输入诊断结果',
        icon: 'none',
        duration: 1500
      })
      return false
    }
    wx.setStorageSync('diagnose', this.data.diagnose)
    wx.navigateTo({
      url: `../rootPage/rootPage?diagnose=${this.data.diagnose}`,
    })
  },
  getAnalysisIdCard(idNumber,type) {
    if (type === 3) {
      // 获取年龄
      let myDate = new Date();
      let age = myDate.getFullYear() - idNumber;
      return age;
    }
  }
})