// components/loginDialog/loginDialog.js
const app = getApp();
const commonFun = require('../../utils/common');
const httpUtil = require('../../utils/http-util');

Component({

  /**
   * 组件的属性列表
   */
  properties: {
    // 是否隐藏弹出框
    isHiddenDialog: {
      type: Boolean,
      value: true
    },
    title: {
      type: String, // 类型（必填），目前接受的类型包括：String, Number, Boolean, Object, Array, null（表示任意类型）
      value: '您还未登录' // 属性初始值（可选），如果未指定则会根据类型选择一个
    },
    // 弹窗内容
    content: {
      type: String,
      value: '请先登录后使用相应的小程序功能'
    },
    // 弹窗取消按钮文字
    btn_no: {
      type: String,
      value: '暂不登录'
    },
    // 弹窗确认按钮文字
    btn_ok: {
      type: String,
      value: '立即登录'
    }
  },
  data: {
    isHiddenDialog: true, // 是否隐藏
    content_image: "https://com-shuibei-peach-static.100cbc.com/tmcpro/images/home/loginImg.png", // 宣传图片
    nextPageName: "", // 登录后需要跳转的上一级页面的名字
    phone: "",
    doctorPass: ""
  },
  attached:function(options){
    app.watch((value) => {
        // value为app.js中传入的值
        this.getPhone()
    }, "isShowPhoneDialog");
  },
  /**
   * 组件的方法列表
   */
  methods: {
    getPhone: function() {
      console.log('====++++')
      //获得popup组件：登录确认框
      let popup = this.selectComponent("#phoneDialog");
      popup.showPopup();
      // console.log(this.selectComponent("#phoneDialog"))
    },
    //隐藏弹框
    hidePopup: function() {
      this.setData({
        isHiddenDialog: true
      });
    },

    //展示弹框
    showPopup(nextPageName) {
      this.hidePopup()
      this.setData({
        isHiddenDialog: false,
        nextPageName: ""
      });
      if (nextPageName) {
        this.setData({
          nextPageName: nextPageName
        });
      }
    },
    /*
     * 内部私有方法建议以下划线开头
     * triggerEvent 用于触发事件
     */
    _error() {
      //触发取消回调
      this.triggerEvent("error");
      console.log("暂不登录 =》 触发回调");
    },

    _success() {
      //触发成功回调
      this.triggerEvent("success");
      console.log("立即登录 =》 触发回调");
    },

    /**
     * 操作：登录
     */
    getUserInfo: function (e) {
      let that = this;
      let sendE = {
        ...e,
        nextPageName: that.data.nextPageName
      };
      commonFun.getUserInfo(sendE);
      app.globalData.isShowLoginStatus = true
      // that.setData({
      //   isHiddenDialog: true
      // });
    },
    phoneInput(e) {
      this.setData({
        phone: e.detail.value
      })
    },
    doctorPassInput(e) {
      this.setData({
        doctorPass: e.detail.value
      })
    },
    // 手机号登录
    loginByUserPass() {
      if(this.data.phone === '') {
        wx.showToast({
          title: "请输入手机号",
          icon: 'none',
          duration: 1500
        })
        return false
      }
      if(this.data.doctorPass === '') {
        wx.showToast({
          title: "请输入密码",
          icon: 'none',
          duration: 1500
        })
        return false
      }
      wx.showLoading({
        title: '加载中...',
      })
      let params = {
        phone: this.data.phone,
        doctorPass: this.data.doctorPass
      }
      httpUtil.loginByUserPass(params).then(res => {
        wx.hideLoading()
        if(res.code === 0) {
          let obj = {
            phone: res.data.doctorUser.phone
          }
          commonFun.getTmcStaffByPhone(obj)
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
    }
  }
})