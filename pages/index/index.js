const app = getApp();
const HTTP = require('./../../utils/http-util');
const common = require('./../../utils/common');
require("./../../utils/time.js");
var msgStorage = require("./../../utils/msgstorage");
const httpUtil = require('./../../utils/http-util');
var tim = app.globalData.tim;
var TIM = app.globalData.TIM;
Page({

  /**
   * 页面的初始数据
   */
  data: {
    groupList: [],
    doctorInfo: {},
    loading: true,
    statisticsInfo: {},
    isHiddenDialog: true,
    scrollTop: 0,
    systemInfo: app.globalData.systemInfo,
    statusBarHeight: app.globalData.systemInfo.statusBarHeight,
    navBarHeight: app.globalData.navBarHeight,
  },
  /**
   * 监听屏幕滚动 判断上下滚动
   */
  onPageScroll: function (ev) {
    this.setData({
      scrollTop: ev.scrollTop
    })
  },
    /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    msgStorage.off('newChatMsg')
  },
  onHide:function(){
    msgStorage.off('newChatMsg')
  },

  onShow: function () {
    let that = this
    if(app.globalData.isShowTalkList) {
      that.getStatisticsInfo()
      that.getInquiryMultiTalkList()
    }
    msgStorage.on("newChatMsg", function (renderableMsg, type, curChatMsg, sesskey) {
      if (renderableMsg) {
        let conversationID = renderableMsg.conversationID.replace('GROUP', '')
        let arrItem = {}
        if (renderableMsg.payload.description === 'tmc创建问诊') {
          let payloadData = JSON.parse(renderableMsg.payload.data)
          let params = {
            orgID: app.globalData.userInfo.orgID,
            multiTalkID: payloadData.data.talkID
          }
          HTTP.getMultiTalkByID(params).then(res => {
            if (res.code === 0) {
              let data = res.data
              // item.multiTalk.lastSendContent = JSON.stringify(data)
              // item.multiTalk.lastSendTime = that.timeConvert(new Date(), 1)
              data.lastTxt = that.dealLastMsg(data)
              data.unreadCount=1
              data.lastTime = that.dealLastTime(data.multiTalk.lastSendTime)
              that.data.groupList.unshift(data)
              that.setData({
                groupList: that.data.groupList
              })
            }
          })
        } else if (renderableMsg.payload.description === 'tmc结束问诊') {
          that.data.groupList.map((item, index) => {
            if (item.multiTalk.imID === conversationID) {
              that.data.groupList.splice(index, 1)
            }
          })
          that.setData({
            groupList: that.data.groupList
          })
        }else if(renderableMsg.payload.description === 'tmc切换医生'){

        } else {
          that.data.groupList.map((item, index) => {
            if (item.multiTalk.imID === conversationID) {
              item.multiTalk.lastSendContent = JSON.stringify(renderableMsg)
              item.multiTalk.lastSendTime = that.timeConvert(renderableMsg.time, 1)
              item.lastTxt = that.dealLastMsg(item)
              item.lastTime = that.dealLastTime(item.multiTalk.lastSendTime)
              if(!item.unreadCount){
                item.unreadCount=1
              }else{
                item.unreadCount++
              }
              arrItem = JSON.parse(JSON.stringify(item))
              that.data.groupList.splice(index, 1)
            }
          })
          if (JSON.stringify(arrItem) !== '{}') {
            that.data.groupList.unshift(arrItem)
            that.setData({
              groupList: that.data.groupList
            })
          }
        }

      }
    });
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 获取用户信息
    let that = this
    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userInfo']) {
          // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
          wx.getUserInfo({
            success: res => {
              let obj = {
                detail: res
              }
              common.getUserInfo(obj)
            }
          })
        } else {
          that.setData({
            isHiddenDialog: false
          })
        }
      }
    })
    app.watch((value) => {
      if (value) {
        that.getDoctorInfo()
        that.getStatisticsInfo()
        that.getInquiryMultiTalkList()
        that.getUserSig()
        that.setData({
          isHiddenDialog: true
        })
      }
    }, "isShowIndex");
    app.watch((value) => {
      if(value) {
        that.setData({
          isHiddenDialog: false
        })
      }
    }, "isShowLoginDialog");
  },
  timeConvert(timestamp, num) { //num:0 YYYY-MM-DD  num:1  YYYY-MM-DD hh:mm:ss // timestamp:时间戳 
    timestamp = timestamp + '';
    timestamp = timestamp.length == 10 ? timestamp * 1000 : timestamp;
    var date = new Date(timestamp);
    var y = date.getFullYear();
    var m = date.getMonth() + 1;
    m = m < 10 ? ('0' + m) : m;
    var d = date.getDate();
    d = d < 10 ? ('0' + d) : d;
    var h = date.getHours();
    h = h < 10 ? ('0' + h) : h;
    var minute = date.getMinutes();
    var second = date.getSeconds();
    minute = minute < 10 ? ('0' + minute) : minute;
    second = second < 10 ? ('0' + second) : second;
    if (num == 0) {
      return y + '-' + m + '-' + d;
    } else {
      return y + '-' + m + '-' + d + ' ' + h + ':' + minute + ':' + second;
    }
  },
  /*获取群未读消息数 */
  getUnreadMessageCount: function () {
    let that = this;
    // 拉取会话列表
    let promise = tim.getConversationList();
    promise.then(function (imResponse) {
      if (imResponse.code === 0) {
        let list = imResponse.data.conversationList || []
        that.data.groupList.map(item => {
          list.map((listItem) => {
            if (item.multiTalk.imID === listItem.conversationID.replace('GROUP', '')) {
              item.unreadCount = listItem.unreadCount
            }
          })
        })
        that.setData({
          groupList: that.data.groupList
        })
      }
    }).catch(function (imError) {
      console.warn('getConversationList error:', imError); // 获取会话列表失败的相关信息
    });
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
   * 点击某一个
   * @param {*} event 
   */
  handleItem(event) {
    let item = event.currentTarget.dataset.item
    app.globalData.chatKeyId = item.imID;
    app.globalData.doctorInfo = item.doctor;
    wx.removeStorageSync('query')
    wx.setStorageSync('chatInfo', JSON.stringify(item))
    wx.setStorageSync('doctorInfo', JSON.stringify(item.doctor))
    wx.navigateTo({
      url: '/pages/online-inquiry/inquiry/chat/chat',
    })
  },
  /**
   * 获取userSig
   */
  getUserSig() {
    common.getUserSig(app.globalData.userInfo.assistantStaffID)
  },
  /**
   * 获取医生信息
   */
  getDoctorInfo() {
    let params = {
      staffID: app.globalData.userInfo.assistantStaffID
    }
    wx.showLoading({
      title: '加载中...'
    });
    HTTP.getDoctorInfoByStaffID(params).then(res => {
      wx.hideLoading();
      if (res.code === 0) {
        this.setData({
          doctorInfo: res.data
        })
      }
    }).catch(() => {
      wx.hideLoading();
    });
  },
  /**
   * 页面跳转
   */
  handleGo(event) {
    let type = event.currentTarget.dataset.type
    let url = ''
    switch (type) {
      case '1':
        // 患者管理
        url = `/pages/patientManage/patientManage`
        break;
      case '2':
        // 订单记录
        url = `/pages/historyOrders/historyOrders`
        break;
      case '3':
        // 二维码
        url = `/pages/businessCard/businessCard?info=${JSON.stringify(this.data.doctorInfo)}`
        break;
      case '4':
        // 设置
        url = `/pages/setting/setting?info=${JSON.stringify(this.data.doctorInfo)}`
        break;
    }
    wx.navigateTo({
      url: url,
    });
  },
  /**
   * 查询问诊中的患者列表
   */
  getInquiryMultiTalkList() {
    wx.showLoading({
      title: '加载中...'
    });
    let params = {
      orgID: app.globalData.userInfo.orgID,
      staffID: app.globalData.userInfo.assistantStaffID,
      type: 1
    }
    HTTP.getInquiryMultiTalkList(params).then(res => {
      wx.hideLoading();
      if (res.code === 0) {
        let list = res.data || []
        list.map(item => {
          item.lastTxt = this.dealLastMsg(item)
          item.lastTime = this.dealLastTime(item.multiTalk.lastSendTime)
        })
        this.setData({
          groupList: list
        })
        setTimeout(() => {
          this.setData({
            loading: false
          })
        }, 50)
        app.globalData.isShowTalkList = true
      }
    }).catch((error) => {
      wx.hideLoading();
    });
  },
  dealLastTime(time) {
    let dateStr = "";
    if (typeof (time) === "string") {
      var index = time.lastIndexOf("\.");
      if (index > -1) {
        time=(time.replace(/-/g, "/"))
        time = new Date(time.substring(0, index)).getTime() / 1000;
      } else {
        time=(time.replace(/-/g, "/"))
        time = new Date().getTime() / 1000;
      }
    }

    if (!isNaN(time)) {
      dateStr = new Date(time * 1000).toWeiXinString();
    }
    return dateStr;
  },
  dealLastMsg(item) {
    let msg = item.multiTalk.lastSendContent;
    try {
      if (msg) {
        let msgObj = JSON.parse(item.multiTalk.lastSendContent);
        let msgType = msgObj.type;
        let msgContent = "";
        if (msgObj._elements) {
          msgContent = msgObj._elements[0].content || "";
        }
        switch (msgType) {
          case "TIMTextElem":
            return msgContent.text;
          case "TIMLocationElem":
            break;
          case "TIMFaceElem":
            break;
          case "TIMCustomElem":
            let dataObj = JSON.parse(msgContent.data);
            if (dataObj.customType === "hint") {
              return "[" + dataObj.data.text + "]";
            } else if (dataObj.customType === "card") {
              return "[" + dataObj.data.title + "]";
            } else {
              return "";
            }
            case "TIMSoundElem":
              return "[语音]";
            case "TIMImageElem":
              return "[图片]";
            case "TIMFileElem":
              break;
            case "TIMVideoFileElem":
              break;
        }
      };
    } catch (error) {
      console.error(error);
    }
  },
  /**
   * 查询问诊中的患者列表
   */
  getStatisticsInfo() {
    wx.showLoading({
      title: '加载中...'
    });
    let params = {
      orgID: app.globalData.userInfo.orgID,
      assistantStaffID: app.globalData.userInfo.assistantStaffID,
    }
    HTTP.getStatisticsInfo(params).then(res => {
      wx.hideLoading();
      if (res.code === 0) {
        this.setData({
          statisticsInfo: res.data
        })
      }
      setTimeout(() => {
        this.getUnreadMessageCount()
      }, 3000)
    }).catch(() => {
      wx.hideLoading();
    });
  }
})