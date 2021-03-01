// 常量
const app = getApp();
const AUTH = require('/auth');
let HTTP = require('/http-util');
import {
  genTestUserSig
} from '/GenerateTestUserSig';
let tim = getApp().globalData.tim;
let TIM = getApp().globalData.TIM;

// 变量
let userSig = ""; // [必选]身份签名，需要从自行搭建的签名服务获取
// let selctedIndex = 0; //公众号跳转带参数  0在线问诊 1个人中心
let logined = false; //是否处于登录状态
let nextPageName = ""; // 下一页的名字

/**
 * 新增 开始自动登录前 先检查登录态
 * 1.false 重新获取临时code
 * 2.succes 直接获取用户信息 getPatientInfo
 */
function startLoginFun() {
  tim.logout(); // 登录前先清除（可能在线）登录的账号
  userSig = "";
  logined = false;
  nextPageName = "";
  console.log("开始IM登录");
  app.globalData.unionid = wx.getStorageSync('unionid');
  app.globalData.openid = wx.getStorageSync('openID');
  if (app.globalData.unionid && app.globalData.openid) {
    app.globalData.userInfo = wx.getStorageSync('userInfo');
    getPatientInfo();
  } else {
    console.log("IM登录失败：unionid或openID不存在");
    app.globalData.isStartLogin = 1; // 是否开始了自动登录
    app.globalData.isInitInfo = false; // 登录初始化用户数据失败
    fetchTempCode();
  }
}

/**
 * 获取基础数据
 */
function getPatientInfo() {
  let assistantStaffID = wx.getStorageSync("shareAssistantStaffID");
  let orgID = wx.getStorageSync("shareOrgID");
  let prams = {
    thirdUniqueID:app.globalData.openid,
    thirdTypeID:22
    // unionID: app.globalData.unionid,
    // openID: app.globalData.openid,
    // nickName: app.globalData.userInfo.nickName ? app.globalData.userInfo.nickName : '',
    // avatarUrl: app.globalData.userInfo.avatarUrl ? app.globalData.userInfo.avatarUrl : '',
    // sex: app.globalData.userInfo.sex ? app.globalData.userInfo.sex : '',
    // city: app.globalData.userInfo.city ? app.globalData.userInfo.city : '',
    // province: app.globalData.userInfo.province ? app.globalData.userInfo.province : '',
    // assistantStaffID: (assistantStaffID && app.globalData.isHaveOptions) ? assistantStaffID : "",
    // orgID: (orgID && app.globalData.isHaveOptions) ? orgID : ""
  }
  HTTP.getDoctorUserByThirdUniqueID(prams).then(res => {
    if (res.code == 0) {
      console.log("登录后拿到的医生信息：" + JSON.stringify(res.data));
      if(res.data) {
        let obj = {
          phone: res.data.doctorUser.phone
        }
        getTmcStaffByPhone(obj)
        // 获取userSig
        // getUserSig(res.data.orgStaffUser.keyID);
      }else {
        app.globalData.isShowLoginDialog = true
        wx.login({
          success (res) {
            if (res.code) {
              app.globalData.isShowPhoneDialog = true
            } else {
              console.log('登录失败！' + res.errMsg)
            }
          }
        })
        wx.hideLoading();
      }
    } else {
      app.globalData.isStartLogin = true; // 是否开始了自动登录
      wx.hideLoading();
      wx.showToast({
        title: res.message,
        icon: 'none'
      });
    }
  })
  // .catch(e => {
  //   app.globalData.isStartLogin = true; // 是否开始了自动登录
  //   wx.hideLoading();
  //   wx.showToast({
  //     title: '网络异常'
  //   });
  // })
}

function bindPhone(){
  let prams = {
    thirdUniqueID: app.globalData.openid,
    thirdTypeID:22,
    thirdNickName:'',
    thirdTypeName:'weixin_tmcpro',
    phone:''
  };
  HTTP.bindThirdUniqueIDWithPhone(prams).then(res => {

  });
  
}

/**
 * 获取userSig
 */
function getUserSig(userId) {
  wx.showLoading({
    title: '登录中...',
  });
  let prams = {
    userId: userId
  };
  HTTP.getUserSig(prams).then(res => {
    if (res.code == 0) {
      userSig = res.data.userSig
      wx.setStorage({
        key: 'userSig',
        data: res.data.userSig
      });
      if (userSig) {
        loginIM(userId); // IM登录
      }
      
    } else {
      app.globalData.isStartLogin = true; // 是否开始了自动登录
      wx.hideLoading();
      wx.showToast({
        title: '获取userSig失败'
      });
    }
  })
}

/**
 * IM登录
 */
function loginIM(userId) {
  // IM登录
  tim.login({
    userID: userId,
    userSig: genTestUserSig(userId).userSig
  }).then(function(imResponse) {
    console.log("===IM登录成功==="); // 登录成功
    wx.setStorageSync('myUsername', userId);
    if (nextPageName == "chat") {
      app.globalData.isInitInfo = true; // 是否登录成功
      app.globalData.isStartLogin = true; // 是否开始了自动登录
      setTimeout(() => {
        wx.hideLoading();
        // wx.navigateTo({
        //   url: '/pages/online-inquiry/inquiry/chat/chat',
        // });
      }, 1500);
    } else {
      wx.hideLoading();
      app.globalData.isInitInfo = true; // 是否登录成功
      app.globalData.isStartLogin = true; // 是否开始了自动登录
    }
    setTimeout(()=>{
      // app.globalData.isShowPhoneDialog = true
      if(nextPageName=='chat'){
        app.globalData.phoneDialogNextPage='chat'
      }else{
        app.globalData.phoneDialogNextPage=''
      }
    },500)
  }).catch(function(imError) {
    app.globalData.isInitInfo = false
    console.log("===IM登录失败===", JSON.stringify(imError)); // 登录失败的相关信息
    wx.hideLoading();
    wx.showToast({
      title: 'IM登录失败'
    });
  });
}

/**
 * unionid请求
 * 1.unionid请求成功：缓存临时session_key和unionid 并进行后台用户数据请求
 * 1.1缓存session_key：避免多次点击造成的登录态失效，出现的微信授权失败问题
 * 1.2缓存unionid：用于直接登录
 */
function getounionid(isLoginStatus) {
  AUTH.getounionid(isLoginStatus).then(function(res) {
    app.globalData.unionid = wx.getStorageSync('unionid');
    app.globalData.openid = wx.getStorageSync('openID');
    wx.showLoading({
      title: '登录中...',
    });
    getPatientInfo();
  }, function(err) {
    console.log(err);
  })
}

/** 
 * 微信登录
 * 1.登录成功缓存当前临时code 判断登录态用 
 */
function fetchTempCode() {
  wx.removeStorageSync("sessionKey");
  wx.removeStorageSync("code");
  wx.removeStorageSync('openID');
  wx.removeStorageSync('unionid')
  AUTH.fetchTempCode().then(function(res) {
    wx.hideLoading();
    if (res.code) {
      wx.setStorageSync('code', res.code);
    }
  })
}

/**
 * 点击按钮进行授权
 */
function getUserInfo(e) {
  // console.log("手动授权信息：" + JSON.stringify(e));
  nextPageName = "";
  if (!e.detail.encryptedData) {
    return
  };
  if (e.nextPageName) {
    nextPageName = e.nextPageName;
  }
  wx.setStorageSync('encryptedData', e.detail.encryptedData);
  wx.setStorageSync('iv', e.detail.iv);
  wx.setStorageSync('userInfo', e.detail.userInfo);
  // app.globalData.userInfo = e.detail.userInfo;
  app.globalData.unionid = wx.getStorageSync('unionid');
  app.globalData.openid = wx.getStorageSync('openID');
  // 检查登录态是否过期
  wx.checkSession({
    success(res) {
      if (app.globalData.unionid && app.globalData.openid) {
        wx.showLoading({
          title: '登录中...',
        });
        getPatientInfo();
      } else {
        wx.removeStorageSync("sessionKey");
        wx.removeStorageSync("code");
        wx.removeStorageSync('openID');
        wx.removeStorageSync('unionid')
        AUTH.fetchTempCode().then(function(res) {
          if (res.code) {
            wx.setStorageSync('code', res.code);
            getounionid();
          }
        });
      }
    },
    fail(err) {
      wx.removeStorageSync("sessionKey");
      wx.removeStorageSync("code");
      wx.removeStorageSync('openID');
      wx.removeStorageSync('unionid')
      AUTH.fetchTempCode().then(function(res) {
        if (res.code) {
          wx.setStorageSync('code', res.code);
          getounionid();
        }
      });
    }
  });
}

/**
 * 右上角的分享功能
 */
function onShareAppMessageFun(sharePath, moreData) {
  let sharePaths = sharePath ? sharePath : "/pages/index/index";
  let shaOrgId = wx.getStorageSync("shareOrgID");
  let shaAssId = wx.getStorageSync("shareAssistantStaffID");
  let orgID = shaOrgId ? shaOrgId : "";
  let assistantStaffID = shaAssId ? shaAssId : "";
  let orgName = (app.globalData.orgName && app.globalData.orgName.length > 0) ? app.globalData.orgName : wx.getStorageSync("doctorInfo").workPlace;
  let pathAll = sharePaths + '?orgID=' + orgID + '&assistantStaffID=' + assistantStaffID;
  if (moreData) {
    pathAll = pathAll + '&' + moreData;
  }
  return {
    title: orgName, // 转发的标题，默认是小程序的名称(可以写slogan等)
    // path: '/pages/index/home-index/home-index?orgID=' + orgID + '&assistantStaffID=' + assistantStaffID // 默认是当前页面，必须是以‘/'开头的完整路径
    path: pathAll
    // imageUrl: '',   //自定义图片路径，可以是本地文件路径、代码包文件路径或者网络图片路径，支持PNG及JPG，不传入 imageUrl 则使用默认截图。显示图片长宽比是 5:4
    // -------------基础库 2.0.8版本起，不在获取分享结果的回调了-----------
    // success: function (res) {},
    // fail: function (res) {}
    // -----------------------------------------------------------------
  }
}

/**立即问诊（已登录），获取服务通知授权 */
function inquiryRequestMsgFun() {
  wx.requestSubscribeMessage({
    tmplIds: ['Bbgs8xD9AhulzEIr1o6XWmFQT-X6FchA5DrsC03Na-I', 'ZXN1Mte_jwfsTTwZDFB8B2O1lcIVX6-LXab-SX78QvQ', 'RV5tD07jpmtvdnJ2XeJrximwAHQPSPykealX2dzEDS0'], // 1-订单待支付、 2-咨询回复、 3-处方过期
    success(res) {
    },
    fail(err) {
      wx.showToast({
        title: JSON.stringify(err.errMsg),
        icon: "none",
        duration: 3000
      });
    },
    complete(msg) {
      wx.navigateTo({
        url: '/pages/online-inquiry/inquiry/chat/chat'
      });
    }
  });
}

/**立即支付（处方预览页、订单列表页） */
function payRequestMsgFun(keyID) {
  wx.requestSubscribeMessage({
    tmplIds: ['z9hTTCAcnmVfFjU_oCUSADRCE5JL_08PsFjGR2vHOMU', '3leCGE6lKav48Wg0aZFC1FoR_LHX96zPpEngnYtpb-8'], // 1-药品发货、 2-退费成功
    success(res) {
    },
    fail(err) {
      wx.showToast({
        title: JSON.stringify(err.errMsg),
        icon: none,
        duration: 3000
      });
    },
    complete(msg) {
      wx.navigateTo({
        url: "/pages/order/order-details/order-details?orderID=" + keyID
      });
    }
  });
}
function getTmcStaffByPhone(obj) {
  wx.showLoading({
    title: '加载中...',
  })
  HTTP.getTmcStaffByPhone(obj).then(resp => {
    wx.hideLoading()
    if(resp.code === 0) {
      wx.setStorageSync('doctorInfo', resp.data)
      app.globalData.userInfo.orgID = resp.data.orgID
      app.globalData.userInfo.assistantStaffID = resp.data.keyID
      app.globalData.isShowIndex = true
    }else {
      wx.showToast({
        title: "该手机号尚未注册医生账号，请联系管理员！",
        icon: 'none',
        duration: 3000
      })
    }
    wx.hideLoading()
  }).catch(() =>{
    wx.hideLoading()
  })
}
module.exports = {
  startLoginFun: startLoginFun,
  getUserInfo: getUserInfo,
  getUserSig,
  getPatientInfo: getPatientInfo,
  getounionid: getounionid,
  onShareAppMessageFun: onShareAppMessageFun,
  requestMsgFun: inquiryRequestMsgFun,
  payRequestMsgFun: payRequestMsgFun,
  getTmcStaffByPhone: getTmcStaffByPhone
}