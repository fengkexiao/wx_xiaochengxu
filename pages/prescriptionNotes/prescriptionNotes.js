const app = getApp();
const HTTP = require('./../../utils/http-util');
Page({

  /**
   * 页面的初始数据
   */
  data: {
    receiverName: '',
    receiverPhone: '13146595462',
    drugList: [],
    patientInfo:{},
    diagnose: '',
    newDate: {}
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 添加药品页面预览时
    let data = options.info?JSON.parse(options.info):''
    let drugList = wx.getStorageSync('drugList')
    let patientInfo = wx.getStorageSync('patientInfo')
    if(data) {
      this.setData({
        diagnose: wx.getStorageSync('diagnose')
      })
      if(drugList) {
        this.setData({
          drugList: drugList?JSON.parse(drugList):[]
        })
      }
      if(patientInfo) {
        this.setData({
          patientInfo: JSON.parse(patientInfo)
        })
      }
    }
    //订单列表查看处方
    let recipe = options.recipe?JSON.parse(options.recipe):''
    let recipes = options.recipes?JSON.parse(options.recipes):''
    if(recipe || recipes) {
      if(recipe) {
        this.getRp(recipe.orgID, recipe.rpID)
      }else {
        this.getRpInfoByInquiryID(recipes)
      }
    }else {
      this.getDate()
    }
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
  getDate() {
    let date = new Date();
    let newDate = {
      year: date.getFullYear(),
      month: date.getMonth() + 1 > 9 ? date.getMonth() + 1 : ("0" + date.getMonth() + 1),
      day: date.getDate() > 9 ? date.getDate() : "0" + date.getDate()
    }
    this.setData({
      newDate: newDate
    })
  },
  // 获取处方数据
  getRp(orgID,rpID) {
    let params = {
      orgID: orgID,
      rpID: rpID
    }
    wx.showLoading({
      title: '加载中',
      icon: 'loading',
    });
    HTTP.getRp(params).then(res => {
      wx.hideLoading()
      if(res.code === 0) {
        let newDate = {
          year: res.data.rpTime.slice(0,4),
          month: res.data.rpTime.slice(5,7),
          day: res.data.rpTime.slice(8,10)
        }
        this.setData({
          newDate: newDate
        })
        this.getPatientDoc(res.data)
        this.setData({
          diagnose: res.data.diagnosis
        })
        this.setData({
          drugList: res.data.rpMedicines
        })
      }
    }).catch(() =>{
      wx.hideLoading()
    })
  },
   // 根据问诊ID查询处方
   getRpInfoByInquiryID(data) {
    wx.showLoading({
      title: '加载中...'
    });
    let params = {
      orgID: data.orgID,
      inquiryID: data.rpID
    }
    HTTP.getRpInfoByInquiryID(params).then(res => {
      wx.hideLoading()
      if(res.code === 0) {
        if(res.data && res.data.rp) {
          let newDate = {
            year: res.data.rp.rpTime.slice(0,4),
            month: res.data.rp.rpTime.slice(5,7),
            day: res.data.rp.rpTime.slice(8,10)
          }
          this.setData({
            newDate: newDate
          })
          this.setData({
            diagnose: res.data.rp.diagnosis
          })
          this.getPatientDoc(res.data.rp)
          this.setData({
            drugList: res.data.rpMedicines
          })
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
          patientInfo: {...data, ...obj}
        })
      }
    }).catch(() =>{
      wx.hideLoading();
    })
  },
})