const HTTP = require('http-util')

let app = getApp()
let sessionKey = ''

/**
 * 微信权限设置
 */
function getSetting() {
  wx.getSetting({
    success(res) {
      if (!res.authSetting['scope.record']) {
        wx.authorize({
          scope: 'scope.record',
          success() {
            // 用户已经同意小程序使用录音功能，后续调用 wx.startRecord 接口不会弹窗询问
          }
        })
      }
    }
  })
}

/**
 * 初次加载判断网络情况
 * 无网络状态下根据实际情况进行调整
 */
function getNetworkType() {
  let that = this;
  wx.getNetworkType({
    success(res) {
      const networkType = res.networkType
      if (networkType === 'none') {
        that.globalData.isConnected = false
        wx.showToast({
          title: '当前无网络',
          icon: 'loading',
          duration: 2000
        })
      }
    }
  })
}

/**
 * 监听网络状态变化
 * 可根据业务需求进行调整
 */
function onNetworkStatusChange() {
  let that = this;
  wx.onNetworkStatusChange(function(res) {
    if (!res.isConnected) {
      that.globalData.isConnected = false
      wx.showToast({
        title: '网络已断开',
        icon: 'loading',
        duration: 2000
      })
    } else {
      that.globalData.isConnected = true
      wx.hideToast()
    }
  })
}

/**
 * 版本更新
 */
function upDataApp() {
  if (wx.canIUse('getUpdateManager')) { //判断当前微信版本是否支持版本更新
    const updateManager = wx.getUpdateManager();
    updateManager.onCheckForUpdate(function(res) {
      if (res.hasUpdate) { // 请求完新版本信息的回调
        updateManager.onUpdateReady(function() {
          wx.showModal({
            title: '更新提示',
            content: '新版本已经准备好，是否重启应用？',
            success: function(res) {
              if (res.confirm) { // 新的版本已经下载好，调用 applyUpdate 应用新版本并重启
                updateManager.applyUpdate()
              }
            }
          })
        });
        updateManager.onUpdateFailed(function() {
          wx.showModal({ // 新的版本下载失败
            title: '已经有新版本了哟~',
            content: '新版本已经上线啦~，请您删除当前小程序，重新搜索打开哟~',
          })
        })
      } else {}
    })
  } else {
    wx.showModal({ // 如果希望用户在最新版本的客户端上体验您的小程序，可以这样子提示
      title: '提示',
      content: '当前微信版本过低，无法使用该功能，请升级到最新微信版本后重试。'
    })
  }
}
/** 
 * 微信登录
 * 1.登录成功缓存当前临时code 判断登录态用 
 */
function fetchTempCode() {
  return new Promise((resolve, reject) => {
    console.log('---登录')
    let that = this
    wx.showLoading({
      title: '登录中...',
    })
    wx.login({
      success(res) {
        wx.hideLoading();
        resolve(res);
      },
      fail() {
        wx.hideLoading()
        wx.showToast({
          title: '登录失败',
          icon: 'none'
        })
      }
    })
  })
}

/**
   * unionid请求
   * 1.unionid请求成功：缓存临时session_key和unionid 并进行后台用户数据请求
   * 1.1缓存session_key：避免多次点击造成的登录态失效，出现的微信授权失败问题
   * 1.2缓存unionid：用于直接登录
   *isLoginStatus true为登录状态有效 可以直接用以前的sessionKey 直接获取
   */
function getounionid(isLoginStatus) {
  wx.showLoading({
    title: '加载中...'
  });
  let params = {
    code: wx.getStorageSync('code') ? wx.getStorageSync('code') : '',
    encryptedData: wx.getStorageSync('encryptedData') ? wx.getStorageSync('encryptedData') : '',
    iv: wx.getStorageSync('iv') ? wx.getStorageSync('iv') : '',
    source:'tmc_ip_doctor'
  }
  return new Promise((resolve,reject)=>{
    HTTP.getWXAuth(params).then(res => {
      wx.hideLoading()
      if (res.code == 0) {
        wx.setStorageSync('sessionKey', res.data.session_key);
        wx.setStorageSync('unionid', res.data.unionid);
        wx.setStorageSync('openID', res.data.openid);
        sessionKey = res.data.session_key;
        resolve(res.data.unionid, res.data.openid);
      } else {
        reject()
        wx.showToast({
          title: res.message,
          icon: 'none'
        })
      }
    }).catch(e => {
      wx.hideLoading()
      reject()
      wx.showToast({
        title: '网络异常'
      })
    })
  })
  
}

module.exports = {
  getSetting: getSetting,
  getNetworkType: getNetworkType,
  onNetworkStatusChange: onNetworkStatusChange,
  upDataApp: upDataApp,
  fetchTempCode: fetchTempCode,
  getounionid: getounionid
}