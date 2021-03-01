// 引入腾讯云IM
import TIM from './miniprogram_npm/tim-wx-sdk/index.js';
import COS from './miniprogram_npm/cos-wx-sdk-v5/index.js';

const {
  Event
} = require('utils/event')
const AUTH = require('utils/auth');
let msgStorage = require("utils/msgstorage");
import {
  SDKAPPID
} from './utils/GenerateTestUserSig';

let HTTP = require('utils/http-util');

let rect = wx.getMenuButtonBoundingClientRect ? wx.getMenuButtonBoundingClientRect() : null;
//胶囊按钮位置信息
let systemInfo = wx.getSystemInfoSync();
let navBarHeight = (function () { //导航栏高度
  let gap = rect.top - systemInfo.statusBarHeight; //动态计算每台手机状态栏到胶囊按钮间距
  return 2 * gap + rect.height;
})();
// 变量
let tim = null;
let that = null;

App({
  event: new Event(),
  onLaunch: function (option) {
    that = this;
    that.globalData.systemInfo = systemInfo;
    that.globalData.navBarHeight = navBarHeight;
    that.globalData.isShowPhoneDialog = false
    that.globalData.isShowLoginDialog = false
    that.globalData.isShowLoginStatus = false
    that.globalData.isShowCoupon = false
    that.globalData.isShowIndex = false
    that.globalData.isShowTalkList = false
    that.globalData.currentPage = '首页'
    that.globalData.phoneDialogNextPage = ''
    that.globalData.isClickChat = false
    that.globalData.menuButtonBoundingClientRect = rect;
    AUTH.upDataApp();
    AUTH.getNetworkType();
    AUTH.onNetworkStatusChange();
    that.imSetting(); // IM功能配置
    //版本更新检测
    that.autoUpdate()
    // that.loginIM(that.globalData.userInfo.assistantStaffID,)
  },
 
  /**
   * 初始化获取参数值
   * @param {初始化获取参数值} option 
   */
  init(option) {
    /** 测试数据start */
    //     HTTP.getCache({
    //   bizID: '22020032715213266114761',
    //     clientID: '20032611152902159081301150',
    //     sign: 'c4929e5df0b12ad26662412ac1b278ef',
    //     timestamp: '1600763307000',
    //     orderPatientID: '20092216152561275931339150',
    //     doctorID:"20030919394386260250531253",
    //     rpOderID:"20092216152561228801337150"
    // }).then(res => {
    //   that.loginIM('20092115455087757971339150', res.data.userSig, 1)
    // })

    /** 测试数据end */
    console.log('app页面')
    wx.showLoading({
      title: '加载中'
    })
    that.globalData.query = option.query;
    if (option.referrerInfo && option.referrerInfo.extraData) {
      that.globalData.query = {
        ...that.globalData.query,
        ...option.referrerInfo.extraData
      }
    }
    wx.setStorageSync('bizID', option.query.bizID)

    let {
      bizID,
      clientID,
      sign,
      timestamp,
      orderPatientID,
      staffID,
      orderStatus,
      doctorID
    } = that.globalData.query
    that.globalData.chatKeyId = staffID
    if (orderStatus == -1) {
      return
    }
    let _data = {
      bizID,
      clientID,
      sign,
      timestamp,
      orderPatientID
    }
    if (doctorID) {
      _data.doctorID = doctorID
    }
    //模拟调整聊天页
    HTTP.getCache(_data).then(res => {
      if (res.data.doctorUser) {
        that.globalData.doctorInfo = res.data.doctorUser
      }
      console.log('模拟调整聊天页')
      that.loginIM(orderPatientID, res.data.userSig, 1)
    })
  },

  /**
   * 自动更新
   */
  autoUpdate: function () {
    var self = this
    // 获取小程序更新机制兼容
    if (wx.canIUse('getUpdateManager')) {
      const updateManager = wx.getUpdateManager()
      //1. 检查小程序是否有新版本发布
      updateManager.onCheckForUpdate(function (res) {
        // 请求完新版本信息的回调
        if (res.hasUpdate) {
          //2. 小程序有新版本，则静默下载新版本，做好更新准备
          updateManager.onUpdateReady(function () {
            wx.showModal({
              title: '更新提示',
              content: '新版本已经准备好，是否重启应用？',
              success: function (res) {
                if (res.confirm) {
                  //3. 新的版本已经下载好，调用 applyUpdate 应用新版本并重启
                  updateManager.applyUpdate()
                } else if (res.cancel) {
                  //如果需要强制更新，则给出二次弹窗，如果不需要，则这里的代码都可以删掉了
                  wx.showModal({
                    title: '温馨提示~',
                    content: '本次版本更新涉及到新的功能添加，旧版本无法正常访问的哦~',
                    success: function (res) {
                      self.autoUpdate()
                      return;
                      //第二次提示后，强制更新                      
                      if (res.confirm) {
                        // 新的版本已经下载好，调用 applyUpdate 应用新版本并重启
                        updateManager.applyUpdate()
                      } else if (res.cancel) {
                        //重新回到版本更新提示
                        self.autoUpdate()
                      }
                    }
                  })
                }
              }
            })
          })
          updateManager.onUpdateFailed(function () {
            // 新的版本下载失败
            wx.showModal({
              title: '已经有新版本了哟~',
              content: '新版本已经上线啦~，请您删除当前小程序，重新搜索打开哟~',
            })
          })
        }
      })
    } else {
      // 如果希望用户在最新版本的客户端上体验您的小程序，可以这样子提示
      wx.showModal({
        title: '提示',
        content: '当前微信版本过低，无法使用该功能，请升级到最新微信版本后重试。'
      })
    }
  },

  watch: function (method, globalDataName) {
    var obj = that.globalData;
    Object.defineProperty(obj, globalDataName, {
      configurable: true,
      enumerable: true,
      set: function (value) {
        that._name = value;
        method(value); // 传递值，执行传入的方法
      },
      get: function () {
        // 可以在这里打印一些东西，然后在其他界面调用getApp().globalData.globalDataName的时候，这里就会执行。
        return that._name
      }
    })
  },

  /**
   * IM配置
   */
  imSetting() {

    // 创建 TIM SDK 实例
    tim = TIM.create({
      SDKAppID: SDKAPPID
    });
    // 设置日志级别
    // tim.setLogLevel(0); // 普通级别，日志量较多，接入时建议使用
    tim.setLogLevel(1); // release 级别，SDK 输出关键信息，生产环境时建议使用
    // 将腾讯云对象存储服务 SDK （以下简称 COS SDK）注册为插件，IM SDK 发送文件、图片等消息时，需要用到腾讯云的 COS 服务
    // 注册 COS SDK 插件
    tim.registerPlugin({
      'cos-wx-sdk': COS
    });
    // 监听事件
    tim.on(TIM.EVENT.SDK_READY, function (event) {
      // 收到离线消息和会话列表同步完毕通知，接入侧可以调用 sendMessage 等需要鉴权的接口
      that.globalData.isInitInfo = true;
      console.log("============TIM SDK已处于READY状态==================");
    });

    tim.on(TIM.EVENT.MESSAGE_RECEIVED, function (event) {
      // 收到推送的单聊、群聊、群提示、群系统通知的新消息，可通过遍历 event.data 获取消息列表数据并渲染到页面
      // event.data - 存储 Message 对象的数组 - [Message]
      // console.log("===全局收消息===" + JSON.stringify(event));
      // 全局收消息分发
      msgStorage.saveReceiveMsg(event.data);
    });

    tim.on(TIM.EVENT.MESSAGE_REVOKED, function (event) {
      // 收到消息被撤回的通知
      // console.log("===收到消息被撤回===" + JSON.stringify(event.data));
    });

    tim.on(TIM.EVENT.CONVERSATION_LIST_UPDATED, function (event) {
      // 收到会话列表更新通知，可通过遍历 event.data 获取会话列表数据并渲染到页面 
      // console.log("===会话列表===" + JSON.stringify(event.data));
    });

    tim.on(TIM.EVENT.GROUP_LIST_UPDATED, function (event) {
      // 收到群组列表更新通知，可通过遍历 event.data 获取群组列表数据并渲染到页面
      // console.log("===群组列表===" + JSON.stringify(event.data));
    });

    tim.on(TIM.EVENT.GROUP_SYSTEM_NOTICE_RECEIVED, function (event) {
      // 收到新的群系统通知
      // console.log("===收到群系统通知===" + JSON.stringify("群系统通知的类型:" + event.data.type
      //   + ",Message对象:" + event.data.message));
    });

    tim.on(TIM.EVENT.PROFILE_UPDATED, function (event) {
      // 收到自己或好友的资料变更通知
      // console.log("===存储 Profile 对象的数组===" + JSON.stringify(event.data));
    });

    tim.on(TIM.EVENT.BLACKLIST_UPDATED, function (event) {
      // 收到黑名单列表更新通知
      // console.log("===存储 userID 的数组===" + JSON.stringify(event.data));
    });

    tim.on(TIM.EVENT.ERROR, function (event) {
      // 收到 SDK 发生错误通知，可以获取错误码和错误信息
      // console.log("===错误码===" + "错误码:" + event.data.code + ",错误信息:" + event.data.message);
    });

    tim.on(TIM.EVENT.SDK_NOT_READY, function (event) {
      // 收到 SDK 进入 not ready 状态通知，此时 SDK 无法正常工作
      // console.log("===SDK 进入 not ready 状态通知===");
    });

    tim.on(TIM.EVENT.KICKED_OUT, function (event) {
      // 收到被踢下线通知
      // event.data.type - 被踢下线的原因，例如:
      //    - TIM.TYPES.KICKED_OUT_MULT_ACCOUNT 多实例登录被踢
      //    - TIM.TYPES.KICKED_OUT_MULT_DEVICE 多终端登录被踢
      //    - TIM.TYPES.KICKED_OUT_USERSIG_EXPIRED 签名过期被踢
      // console.log("===收到被踢下线通知===" + event.name + ",被踢下线的原因:" + event.data.type);
    });
    that.globalData.tim = tim;
    that.globalData.TIM = TIM;
  },

  /**
   * 转换传递的url参数 q 
   */
  initOptionsFun: function (scan_url, name) {
    var reg = new RegExp("[^\?&]?" + encodeURI(name) + "=[^&]+");
    var arr = scan_url.match(reg);
    if (arr != null) {
      return decodeURI(arr[0].substring(arr[0].search("=") + 1));
    } else {
      return "";
    }
  },
  /** 
   * IM登录
   */
  loginIM: function (userId, userSig, flag) {
    tim.logout();
    // if (!that.globalData.isFistLoad) {
    //   return
    // }
    tim.login({
      userID: userId,
      userSig: userSig
    }).then(function (imResponse) {
      that.globalData.isFistLoad = false
      wx.hideLoading();
      console.log("===IM登录成功==="); // 登录成功
    }).catch(function (imError) {
      that.globalData.isFistLoad = false
      that.globalData.isInitInfo = false

      console.log("===IM登录失败===", JSON.stringify(imError)); // 登录失败的相关信息
      wx.hideLoading();
      wx.showToast({
        title: 'IM登录失败'
      })
    });
  },
  /**
   * 微信登录
   * 1.登录成功缓存当前临时code 判断登录态用
   */
  fetchTempCode: function () {
    wx.removeStorageSync("sessionKey");
    wx.removeStorageSync("code");
    wx.removeStorageSync('openID');
    wx.removeStorageSync('unionid');
    AUTH.fetchTempCode().then(function (res) {
      wx.hideLoading();
      if (res.code) {
        wx.setStorageSync('code', res.code);
      }
    })
  },
  /**
   * 全局变量
   */
  globalData: {
    isFistLoad: true,
    tim: null,
    TIM: null,
    p: "",
    isInitInfo: false, // false：未登录  ：true已登录
    loginNum: 0, // 登录次数
    isHaveOptions: false, // 进入小程序是否携带参数
    isStartLogin: false, // 是否尝试了自动登录
    userInfo: {
      // orgID: "19121923373037086560511253",
      // assistantStaffID: "20011320532175746910514253"
      // orgID: "19121923373037086560511253",
      // assistantStaffID: "20121515315761435120514253"
    },
    personInfo: {},
    doctorInfo: null,
    assistantInfo: {},
    isConnected: true,
    unionid: '', //unionidId
    patientID: '', //病人id
    openid: '',
    orgName: '',
    personID: '',
    orgID: '',
    chatKeyId: "",
    menuButtonBoundingClientRect: {}, //右上角胶囊的信息
    systemInfo: {}, //小程序系统信息
    navBarHeight: '', //导航栏高度
    imagePlaceholder: "https://com-shuibei-peach-static.100cbc.com/tmcpro/images/home/imgNone.png", // 图片占位
  },

})