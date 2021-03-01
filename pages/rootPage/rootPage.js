const app = getApp();
const HTTP = require("../../utils/http-util");
var tim = app.globalData.tim;
var TIM = app.globalData.TIM;
Page({

  /**
   * 页面的初始数据
   */
  data: {
    dialogShow: false,
    showOneButtonDialog: false,
    buttons: [{
      text: '取消'
    }, {
      text: '确定'
    }],
    oneButton: [{
      text: '确定'
    }],
    drugList: [],
    keyId: '20101915561709744543008060',
    diagnose: '',
    index: 0,
    patientInfo: {},
    pagesList: []
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.setData({
      // diagnose: options.diagnose
      // diagnose: JSON.parse(wx.getStorage({
      //   key: 'diagnose',
      // }))
    })
    let data = wx.getStorageSync('patientInfo')
    if(data) {
      this.setData({
        patientInfo: JSON.parse(data)
      })
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
    let drugList = wx.getStorageSync('drugList')
    if(drugList) {
      drugList = JSON.parse(drugList)
      drugList.forEach(ele => {
        ele.price = ele.price
        ele.unitPrice = ele.unitPrice
      })
      this.setData({
        drugList: drugList
      })
    }else {
      drugList = []
    }
    let pages = getCurrentPages()
    this.setData({
      pagesList: pages
    })
    console.log(pages)
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
  // 添加药品
  addRecipe: function() {
    wx.navigateTo({
      url: '../drugSearch/drugSearch',
    })
  },
  // 编辑药品
  editMedicine: function(e) {
    let index = e.currentTarget.dataset.index
    wx.navigateTo({
      url: `../usageAndDosage/usageAndDosage?index=${index}&type=edit`,
    })
  },
  // 确认删除药品
  removeRecipe: function() {
    wx.mess
  },
  openConfirm: function (e) {
    this.setData({
      index:  e.currentTarget.dataset.index
    })
    this.setData({
      dialogShow: true
    })
  },
  tapDialogButton(e) {
    if(e.detail.index === 1) {
      let drugList = this.data.drugList
      drugList.splice(this.data.index,1)
      this.setData({
        drugList: drugList
      })
      wx.setStorageSync('drugList', JSON.stringify(drugList))
    }
    this.setData({
      dialogShow: false,
      showOneButtonDialog: false
    })
  },
  // 预览处方笺
  preview() {
    let info = {
      keyId: this.data.keyId,
      diagnose: this.data.diagnose
    }
    wx.navigateTo({
      url: `../prescriptionNotes/prescriptionNotes?info=${JSON.stringify(info)}`,
    })
  },
  // 开处方
  saveRP() {
    let info = this.data.patientInfo,medicinesList = [];
    wx.showLoading({
      title: '加载中...'
    });
    let  totalPrice = 0
    this.data.drugList.forEach(ele => {
      ele.unitPrice = ele.price?ele.price:ele.unitPrice 
      totalPrice = totalPrice + ele.unitPrice * ele.medicineAmount
    })
    let params = {
        "rp":{
          "modifyTime": info.modifyTime,
          "keyID": info.keyIDs,
          "orderID": info.orderID,
          "price": totalPrice,
          "rpAdvice": '',
          "diagnosis": wx.getStorageSync('diagnose'),
          "inquiryID": info.inquiryInfo.keyID,
          "orgID": info.orgID,
          "patientID": info.keyID,
          "personID": info.personID,
          "patientName": info.patientName,
          "sex": info.sex,
          "age": info.age,
          "duration": '',
          "historyOfSickness": info.historyOfSickness?info.historyOfSickness:'无',
          "historyOfAllergy": info.historyOfAllergy?info.historyOfAllergy:'无',
          "liver": info.liver?info.liver:"正常",
          "renal": info.renal?info.renal:"正常",
          "pregnancy": info.pregnancy,
          "rpStatus": '1',
          "rpType": "0",
          "assistantStaffID": info.assistantStaffID,
          "assistantName": info.assistantName,
          "doctorStaffID": info.doctorStaffID,
          "doctorName": info.doctorName,
        },
        "rpMedicines":this.data.drugList
    }
    HTTP.saveRP(params).then(res => {
      wx.hideLoading()
      if(res.code === 0) {
        this.sendRpMessage(this.data.pagesList)
      }else {
        wx.showToast({
          title: res.message,
          icon: 'none',
          duration: 1500
        })
      }
    }).catch(() => {
      wx.hideLoading()
    })
  },
  // 发送处方消息
  sendRpMessage (list) {
    let that = this
    let data = {
      customType: "card",
      childType: "rpInfo",
      data: {
        title: "诊断：" + wx.getStorageSync('diagnose'),
        orgID: this.data.patientInfo.orgID,
        inquiryID: this.data.patientInfo.inquiryInfo.keyID
      }
    };
    let payload = {
      data: JSON.stringify(data),
      description: "[处方详情]",
      extension: "tmc"
    };
    let message = tim.createCustomMessage({
      //to: that.data.inquiryInfo.keyID, // 群ID
      to: that.data.patientInfo.inquiryInfo.keyID, // 群ID
      conversationType: TIM.TYPES.CONV_GROUP, // 群聊
      payload: payload
    });
    tim.sendMessage(message).then(res => {
      list.forEach((ele,index)=> {
        if(ele.is === "pages/online-inquiry/inquiry/chat/chat") {
          wx.navigateBack({
            delta: list.length - (index + 1)
          })
        }
      })
      console.log('sendMessage success:', res);
    }).catch( imError=>{
      console.warn('sendMessage error:', imError);
    })
  },
})