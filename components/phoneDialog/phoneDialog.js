const app = getApp();
import HTTP from '../../utils/http-util';
import commonFun from '../../utils/common';
Component({
  /** 
   * 组件的属性列表 
   */
  properties: {
    /** 
     * 是否隐藏弹出框 
     */
    isHiddenDialog: {
      type: Boolean,
      value: true
    },
    /** 
     * type 类型（必填），目前接受的类型包括：String, Number, Boolean, Object, Array, null（表示任意类型） 
     * value 属性初始值（可选），如果未指定则会根据类型选择一个 
     */
    title: {
      type: String,
      value: '微信授权'
    },
    // 弹窗内容 
    content: {
      type: String,
      value: '微信授权成功'
    },
    // 弹窗取消按钮文字 
    btn_no: {
      type: String,
      value: '拒绝'
    },
    // 弹窗确认按钮文字 
    btn_ok: {
      type: String,
      value: '允许'
    }
  },

  /** 
   * 组件的初始数据 
   */
  data: {
    isHiddenDialog: true, // 是否隐藏 
    content_image: "/images/phone_allow.png",
    nextPageName: "" // 登录后需要跳转的下一级页面的名字 
  },

  /** 
   * 组件的方法列表 
   */
  methods: {
    //隐藏弹框 
    hidePopup: function () {
      this.setData({
        isHiddenDialog: true
      });
    },

    //展示弹框 
    showPopup(nextPageName) {
      this.setData({
        isHiddenDialog: false,
        nextPageName: nextPageName ? nextPageName : ""
      });
    },

    /* 
     * 内部私有方法建议以下划线开头 
     * triggerEvent 用于触发事件 
     */
    _error() {
      setTimeout(() => {
        app.globalData.isShowCoupon = true
      }, 500)
      this.hidePopup();
      this.triggerEvent("error");
    },

    _success() {
      this.hidePopup();
      this.triggerEvent("success");
    },

    /** 
     * 操作：微信自带弹窗授权获取手机号(拒绝和允许) 
     */
    getPhoneNumber(e) {
      console.log('====')
      console.log(e)
      console.log(app.globalData.phoneDialogNextPage)
      let that = this
      let sessionKey = wx.getStorageSync("sessionKey");
      let prams = {
        personID: "",
        encryptedData: e.detail.encryptedData,
        sessionkey: sessionKey,
        iv: e.detail.iv
      };
      if (e.detail.errMsg == "getPhoneNumber:ok") { // 点击允许 
        // 检查登录态
        wx.checkSession({
          success: () => {
            HTTP.decryptionPhone(prams).then(res => {
              if (res.code === 0) {
                app.globalData.userInfo.phone = res.data || '';
                wx.setStorageSync('userInfo', app.globalData.userInfo);
                wx.getUserInfo({
                  success: function (user) {
                    var userInfo = user.userInfo
                    var nickName = userInfo.nickName
                    let prams = {
                      thirdUniqueID: app.globalData.openid,
                      thirdTypeID: 22,
                      thirdNickName: nickName,
                      thirdTypeName: 'weixin_tmcpro',
                      phone: res.data
                    };
                    HTTP.bindThirdUniqueIDWithPhone(prams).then(resp => {
                      if (resp.code === 0) {
                        let obj = {
                          phone: resp.data.doctorUser.phone
                        }
                        commonFun.getTmcStaffByPhone(obj)
                      } else {
                        wx.showToast({
                          title: resp.message,
                          icon: 'none',
                          duration: 1500
                        })
                      }
                    }).catch(() => {
                      that.setData({
                        isHiddenDialog: true
                      })
                    })
                    let prams1 = {
                      thirdUniqueID: app.globalData.unionid,
                      thirdTypeID: 2,
                      thirdNickName: nickName,
                      thirdTypeName: 'weixin_tmcpro',
                      phone: res.data
                    };
                    HTTP.bindThirdUniqueIDWithPhone(prams1).then(resp => {
                      console.log("unionid绑定success：" + resp.data)
                    }).catch(error => {
                      console.log("unionid绑定error：" + error)
                    })
                  }
                })
              }else {
                wx.showToast({
                  title: "授权失败，请重新登录",
                  icon: 'none',
                  duration: 2000
                })
                this.triggerEvent("fail");
              }
            }).catch(res => {
              wx.showToast({
                title: "授权失败，请重新登录",
                icon: 'none',
                duration: 2000
              })
              this.triggerEvent("fail");
            })
          },
          fail: () => {
            //app.globalData.hasLogin = false;
            wx.showToast({
              title: "授权失败，请重新登录",
              icon: 'none',
              duration: 2000
            })
          }
        })
      } else { // 点击拒绝 
        setTimeout(() => {
          app.globalData.isShowCoupon = true
        }, 500)
        wx.showToast({
          title: "请允许授权使用手机号",
          icon: 'none',
          duration: 2000
        })
        this.triggerEvent("fail");
      }
    }
  }
})