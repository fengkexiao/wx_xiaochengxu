// components/navigation-bar/navigation-bar.js
const app = getApp();
Component({
  options: {
    addGlobalClass: true
  },
  /**
   * 组件的属性列表
   */
  properties: {
    orgin:{
      type:String,
      value: null
    },
    // 页面标题文字（10个字以内）
    navbarTitle: {
      type: String,
      value: ""
    },
    // 页面标题文字颜色（只允许black，white）
    navbarTextStyle: {
      type: String,
      value: "black"
    },
    // 是否显示房子按钮（true，false）
    // showHome: {
    //   type: Boolean,
    //   value: true
    // },
    // 导航栏背景色
    bgColor: {
      type: String,
      value: "#fff"
    },
    isShowBackIcon: {
      type: Boolean,
      value: true
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    statusBarHeight: app.globalData.systemInfo.statusBarHeight,
    navBarHeight: app.globalData.navBarHeight,
    menuBBCRect: app.globalData.menuButtonBoundingClientRect,
    navBackIconBlack: "/images/public/public_left_black.png", // 返回按钮：黑色
    navHomeIconBlack: "/images/public/navHome.png", // 房子按钮：黑色
    isShowBackIcon: true
  },
  attached(options) {
    // if (app.globalData.query&&app.globalData.query.appId) {
    //   this.setData({
    //     isShowBackIcon: true
    //   })
    // } else {
    //   this.setData({
    //     isShowBackIcon: false
    //   })
    // }
  },
  /**
   * 组件的方法列表
   */
  methods: {
    //回退
    navBack: function () {
      let page = getCurrentPages();
      if (page.length > 1) {
        wx.navigateBack({
          delta: 1
        });
      } else {
        wx.navigateBackMiniProgram({
          success(res) {
            // 返回成功
          }
        })
      }
 
    },
    //回主页
    toIndex: function () {
      // let orgID = wx.getStorageSync("orgID");
      // let assistantStaffID = wx.getStorageSync("shareAssistantStaffID");
      // wx.reLaunch({
      //   url: '/pages/index/home-index/home-index?orgID=' + orgID + '&assistantStaffID=' + assistantStaffID
      // });
      wx.reLaunch({
        url: '/pages/index/home-index/home-index'
      });
    }
  }
})