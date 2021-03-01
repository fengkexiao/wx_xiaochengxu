//index.js
//获取应用实例

const HTTP = require('../../utils/http-util');
const app = getApp();
const commonFun = require('../../utils/common.js');

Page({
  data: {
    statusBarHeight: app.globalData.systemInfo.statusBarHeight,
    navBarHeight: app.globalData.navBarHeight,
    screenHeight: app.globalData.systemInfo.screenHeight,
    screenWidth: app.globalData.systemInfo.screenWidth,
    pixelRatio: app.globalData.systemInfo.pixelRatio,
    isSearchState: false, // 是否第一次加载
    shareOrgID: "", // 进入页面携带的orgID
    shareAssistantStaffID: "" // 进入页面携带的医助ID
  },

  /**
   * 1.options无参
   *   （1）通过搜索小程序进入时
   * 2.options有参
   *   （1）通过扫码进入时： "q" 的值为url带参
   *   （2）通过分享的小程序进入时：直接带参
   */
  onLoad: function(options) {
    let that = this;
    // 默认
    // options = {
    //   assistantStaffID: "20011109080410712390514001",
    //   orgID: "19101017081245502880511001"
    // };
    // ht
    // options = {
    //   assistantStaffID: "20020509480115486460514001",
    //   orgID: "19101017081245502880511001"
    // };
    console.log("进入首页携带的参数：" + JSON.stringify(options));
    app.globalData.isHaveOptions = false; // 初始化进入小程序有无携带参数状态
    if (options) {
      if (options.q) { // 通过扫码进入时：q的值为url带参
        app.globalData.isHaveOptions = true; // 进入小程序携带有参数
        var scan_url = decodeURIComponent(options.q);
        let shareOrgID = that.initOptionsFun(scan_url, "orgID");
        let shareAssistantStaffID = that.initOptionsFun(scan_url, "assistantStaffID");
        that.data.shareOrgID = shareOrgID ? shareOrgID : "";
        wx.setStorageSync("shareOrgID", shareOrgID);
        that.data.shareAssistantStaffID = shareAssistantStaffID ? shareAssistantStaffID : "";
        wx.setStorageSync("shareAssistantStaffID", shareAssistantStaffID);
      } else if (options.assistantStaffID || options.orgID) { // 通过分享的小程序进入时：直接带参
        app.globalData.isHaveOptions = true; // 进入小程序携带有参数
        if (options.orgID) {
          that.data.shareOrgID = options.orgID;
          wx.setStorageSync("shareOrgID", options.orgID);
        }
        if (options.assistantStaffID) {
          that.data.shareAssistantStaffID = options.assistantStaffID;
          wx.setStorageSync("shareAssistantStaffID", options.assistantStaffID);
        }
      }
    }
    orgName: app.globalData.orgName;
    let sendOptions = { ...options
    };
    commonFun.startLoginFun(sendOptions);
    // console.log('---用户端系统信息---', app.globalData.systemInfo);
    that.initDocInfoFun();
  },

  // 返回页面时，刷新数据
  onShow: function() {
    let that = this;
    if (that.data.isSearchState) {
      that.initDocInfoFun();
    }
  },

  onReady: function() {
    //获得popup组件：登录确认框
    this.popup = this.selectComponent("#loginDialog");
  },

  //右上角分享功能
  onShareAppMessage: function(res) {
    return commonFun.onShareAppMessageFun();
  },

  /**转换传递的url参数 q */
  initOptionsFun: function(scan_url, name) {
    var reg = new RegExp("[^\?&]?" + encodeURI(name) + "=[^&]+");
    var arr = scan_url.match(reg);
    if (arr != null) {
      return decodeURI(arr[0].substring(arr[0].search("=") + 1));
    } else {
      return "";
    }
  },

  /**初始化数据 */
  initDocInfoFun: function() {
    let that = this;
    if (that.data.shareAssistantStaffID) {
      that.getDefaultDocInfoFun();
    } else {
      wx.getStorage({
        key: 'personInfo',
        success: function(res) {
          // console.log("获取用户缓存问诊信息成功：" + JSON.stringify(res));
          that.fetchDoctorInfo(res.data.doctorStaffID); // 获取主治医师信息
          that.fetchAssistantDoctorInfo(res.data.assistantStaffID); // 获取助理医生信息
        },
        fail: function(err) {
          // console.log("获取用户缓存问诊信息失败：" + JSON.stringify(err));
          that.getDefaultDocInfoFun();
        },
        complete: function(e) {
          that.setData({
            isSearchState: true
          });
        }
      });
    }
  },

  /**获取主治医师信息*/
  fetchDoctorInfo(staffID) {
    let that = this;
    HTTP.getDoctorInfo({
        staffID: staffID
      })
      .then(res => {
        // wx.hideLoading();
        if (res.code == 0) {
          if (res.data) {
            that.setData({
              doctorInfo: res.data
            });
            app.globalData.doctorInfo = res.data;
            wx.setStorageSync('doctorInfo', res.data);
            // that.fetchDoctorQualification(res.data.doctorID); // 获取医生资质编号
          }
        }
      }).catch(e => {
        // wx.hideLoading();
        that.setData({
          noNetwork: true
        });
      })
  },

  /**获取助理医生信息 */
  fetchAssistantDoctorInfo(staffID) {
    let that = this;
    HTTP.getDoctorInfo({
        staffID: staffID
      })
      .then(res => {
        if (res.code == 0) {
          if (res.data) {
            that.setData({
              assistantDoctorInfo: res.data
            });
            wx.setStorageSync('assistantInfo', res.data);
            app.globalData.assistantInfo = res.data;
          }
        }
      }).catch(e => {
        that.setData({
          noNetwork: true
        });
      })
  },

  /**获取医生资质编号 */
  fetchDoctorQualification(doctorID) {
    let that = this;
    HTTP.getDoctorQualification({
        doctorID: doctorID,
        certifyCode: 'PROFESSION'
      })
      .then(res => {
        if (res.code == 0) {
          that.setData({
            certifyInfo: res.data
          })
        }
      }).catch(e => {
        that.setData({
          noNetwork: true
        })
      })
  },

  /**操作：点击查看医生详情 */
  doctorDetailTap: function(e) {
    let index = e.currentTarget.dataset.index;
    let staffID = index == '0' ? app.globalData.personInfo.doctorStaffID : app.globalData.personInfo.assistantStaffID;
    if (staffID) {
      wx.navigateTo({
        url: '/pages/online-inquiry/doctor-details/doctor-details?staffID=' + staffID,
        success: function(res) {},
        fail: function(res) {},
        complete: function(res) {},
      });
    }
  },

  /**
   * 操作：开始问诊
   * 1.已登录，直接到问诊页
   * 2.未登录，授权登录
   *  */
  toOnlineInqueryFun: function() {
    if (app.globalData.isInitInfo) {
      commonFun.requestMsgFun();
    } else {
      let nextPageName = "chat";
      this.popup.showPopup(nextPageName); // 显示登录确认框
    }
  },

  /**查询：无缓存患者信息时，查询默认推荐医生信息 */
  getDefaultDocInfoFun: function() {
    let that = this;
    HTTP.getDefaultDocInfo({
        orgID: that.data.shareOrgID,
        assistantStaffID: that.data.shareAssistantStaffID,
        entryType: ""
      })
      .then(res => {
        // console.log("获取临时推荐医生信息成功：" + JSON.stringify(res));
        if (res.code == 0) {
          wx.setStorageSync("shareAssistantStaffID", res.data.assistantStaffID);
          wx.setStorageSync("shareOrgID", res.data.orgID);
          wx.setStorageSync('personInfo', res.data);
          that.fetchDoctorInfo(res.data.doctorStaffID); // 获取主治医师信息
          that.fetchAssistantDoctorInfo(res.data.assistantStaffID); // 获取助理医生信息
        }
      }).catch(e => {
        // wx.showToast({
        //   title: '数据异常，请重新进入小程序',
        //   icon: none,
        //   duration: 3000
        // });
      })
  },

  /**取消事件 */
  _error() {
    this.popup.hidePopup();
  },

  /**确认事件 */
  _success() {
    this.popup.hidePopup();
  }
})