const app = getApp();
const HTTP = require('./../../utils/http-util');
Page({

  /**
   * 页面的初始数据
   */
  data: {
    search:"",
    tabItemList: ["全部","跟进任务","今日复诊","明日复诊","本周复诊","本月复诊","到期未复诊"],
    active: '0',
    userInfoList:[],
    isFocus: false,
    medicineName: "",
    timer: {},
    pageIndex: 1,
    pageSize: 10,
    portState: true
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    
  },
  // 添加药品
  addMedicine: function(e) {
    let drugInfo = e.currentTarget.dataset.medicineinfo
    wx.navigateTo({
      url: `../usageAndDosage/usageAndDosage?drugInfo=${JSON.stringify(drugInfo)}&type=add`,
    })
  },  
  // 搜索框获取焦点
  focusInput: function() {
    this.setData({
      isFocus: true
    })
  },
  // 取消焦点
  cancelFocus: function() {
    this.setData({
      isFocus: false,
      medicineName: "",
      judge: 0
    })
  },
  bindKeyInput(e) {
    this.setData({
      userInfoList: [],
      judge: 0,
      pageIndex: 1
    })
    this.setData({
      medicineName: e.detail.value
    })
    this.getGoodsListWithUsage(e.detail.value)
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
    this.setData({
      userInfoList: [],
      judge: 0,
      pageIndex: 1
    })
    this.getGoodsListWithUsage("")
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
  // 分页查询药品
  getGoodsListWithUsage(name) {
    let params = {
      orgID: app.globalData.userInfo.orgID,
      pageIndex: this.data.pageIndex,
      pageSize: this.data.pageSize,
      saleStatus: 1,
      orgTypeID: 1,
      medicineName: name,
      medicineClassList: [0,2]
    }
    wx.showLoading({
      title: '加载中...',
    })
    this.setData({
      portState: false
    })
    HTTP.getGoodsListWithUsage(params).then(res => {
      wx.hideLoading()
      this.setData({
        portState: true
      })
      if(res.code === 0) {
        let list = res.data.datas
        if (res.data.totalPage <= this.data.pageIndex) {
          this.setData({
            userInfoList: this.data.userInfoList.concat(list),
            judge: 1
          })
        } else {
          this.setData({
            userInfoList: this.data.userInfoList.concat(list),
            judge: 0
          })
        }
      }
    }).catch(() => {
      wx.hideLoading()
      this.setData({
        portState: true
      })
    })
  },
  // 滚动到底部时
  lower(e) {
    if(this.data.judge === 0 && this.data.portState) {
      this.setData({
        pageIndex: this.data.pageIndex + 1
      })
      this.getGoodsListWithUsage(this.data.medicineName)
    }
  }
})