const app = getApp();
import {
  SDKAPPID
} from '../../../../utils/GenerateTestUserSig'

import {
  genTestUserSig
} from '../../../../utils/GenerateTestUserSig';
var HTTP = require('../../../../utils/http-util');
var msgStorage = require("../../../../utils/msgstorage");
var tim = app.globalData.tim;
var TIM = app.globalData.TIM;

Page({

  data: {
    webrtcroomComponent: null,
    userInfo: {}, // 当前用户信息
    roomID: '', // [必选]房间号，可以由您的服务指定
    receiverStreamId: "",
    sponsorsStreamId: "",
    userID: '', // [必选]用户 ID，可以由您的服务指定，或者使用小程序的 openid
    userSig: '', // [必选]身份签名，需要从自行搭建的签名服务获取
    inquiryInfo: {}, // 问诊信息
    sdkAppID: SDKAPPID /*'1400200900'*/ , // [必选]开通实时音视频服务创建应用后分配的 sdkAppID
    template: 'float', // [必选]标识组件使用的界面模版，组件内置了 bigsmall，float，grid 三种布局
    privateMapKey: '', // 房间权限 key，需要从自行搭建的签名服务获取
    // 如果您没有在【控制台】>【实时音视频】>【您的应用名称】>【帐号信息】中启用权限密钥，可不用填
    beauty: 3, // 美颜指数，取值 0 - 9，数值越大效果越明显
    muted: false, // true 静音 false 不静音
    debug: false, // true 打印推流 debug 信息 fales 不打印推流 debug 信息
    // 其他配置参数可查看 API 文档
    inquiryId: '', // 视频问诊记录id
    customMsgType: '', // 自定义消息类型(根据payload{childType}确定)
    enableCamera: true,
    enableIM: false, // 不启用IM
    isInCalling: false, // 是否视频中
    doctorInfo: {}, // 医生信息
    isAcceptCall: false, // 是否展示接听按钮
    isHiddenAcceptInterface: true, // 是否隐藏接听界面
    isHiddenCallInterface: true, //是否隐藏拨打界面
    isEnterRoom: false, // 是否进入房间(接听之前cancel,接通之后)
    hidden: false, // 是否隐藏接听按钮
    isCanCalling: true // 是否可进行视频通话
  },

  /**
   * 通过 onIMEvent 返回 IM 消息事件，如果 enableIM 已关闭，则可以忽略 onIMEvent
   */
  onIMEvent: function(e) {
    switch (e.detail.tag) {
      case 'big_group_msg_notify':
        //收到群组消息
        console.debug(e.detail.detail);
        break;
      case 'login_event':
        //登录事件通知
        console.debug(e.detail.detail);
        break;
      case 'connection_event':
        //连接状态事件
        console.debug(e.detail.detail);
        break;
      case 'join_group_event':
        //进群事件通知
        console.debug(e.detail.detail);
        break;
    }
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function() {
    msgStorage.off('newChatMsg');
  },

  /**
   * 标签通过 onRoomEvent 返回内部事件
   */
  onRoomEvent: function(e) {
    let that = this;
    switch (e.detail.tag) {
      case 'error':
        {
          //发生错误
          let code = e.detail.code;
          let detail = e.detail.detail;
          // 错误提示窗口是否已经显示
          if (this.data.isErrorModalShow) {
            return;
          }
          this.data.isErrorModalShow = true;
          wx.showModal({
            title: '提示',
            content: code + ":" + detail,
            showCancel: false,
            complete: function() {
              this.data.isErrorModalShow = false;
              this.goBack();
            }
          });
          break;
        }
    }
  },

  /**
   * 云处方创建视频问诊记录
   */
  createVideoInquiry: function() {
    let that = this;
    let prams = {
      bizID: 'tmc',
      bizType: 'tmc',
      clientID: '19100717375019793291301001',
      sponsorsID: app.globalData.personInfo.keyID,
      sponsorsName: app.globalData.personInfo.patientName,
      receiverID: wx.getStorageSync('inquiryInfo').keyID,
      receiverName: wx.getStorageSync('inquiryInfo').keyID,
      patientName: app.globalData.personInfo.patientName,
      requestRole: "0",
      clientUserID: wx.getStorageSync('inquiryInfo').keyID,
      doctorID: wx.getStorageSync('inquiryInfo').doctorStaffID
    };
    console.log(prams);
    HTTP.createVideoInquiry(prams).then(res => {
      console.log("云处方创建视频问诊记录:" + JSON.stringify(res));
      if (res.code === -1 || res.code === "-1") {
        that.setData({
          inquiryId: "",
          isCanCalling: false
        });
        wx.showToast({
          title: "医生忙碌中...",
          icon: "none",
          duration: 2000
        });
        that.exitRoom(); // 停止上传影像
        setTimeout(function() {
          that.goBack(); // 返回聊天页
        }, 2000);
      } else {
        if (res.data.inquiryId) {
          that.setData({
            inquiryId: res.data.inquiryId,
            isCanCalling: true
          });
          setTimeout(function() {
            if (!that.data.isInCalling) {
              wx.showToast({
                title: "医生忙碌中...",
                icon: "none",
                duration: 2000
              });
            }
          }, 30000);
          setTimeout(function() {
            if (!that.data.isInCalling) {
              let dataParams = {
                customType: "sys",
                childType: "video",
                data: {
                  bizId: "tmc",
                  type: "cancel",
                  requestRole: "0"
                }
              };
              let msgPayload = {
                data: JSON.stringify(dataParams),
                description: "[视频问诊消息]",
                extension: 'tmc'
              };
              that.sendCustomMsg(msgPayload);
              // 主动发起视频后，取消 =》 修改响应状态
              let type = 4; // 0:待接诊 1:已接诊 2:未响应 3:拒绝 4:取消
              that.updateInqueryStateFun(type);
            }
          }, 32000);
        }
      }
    }).catch(err => {
      console.log(err);
      wx.showToast({
        title: "发起视频失败",
        icon: "none",
        duration: 2000
      });
      that.exitRoom(); // 停止上传影像
      setTimeout(function() {
        that.goBack(); // 返回聊天页
      }, 2000);
    })
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {
    // console.log('room.js onShow');
    let that = this;
    // 保持屏幕常亮
    wx.setKeepScreenOn({
      keepScreenOn: true
    });
  },

  /**
   * 发送消息
   */
  sendCustomMsg: function(msgPayload) {
    let that = this;
    let data = msgPayload.data;
    let description = msgPayload.description;
    let extension = msgPayload.extension;
    // 创建消息实例
    let message = tim.createCustomMessage({
      to: wx.getStorageSync('inquiryInfo').keyID,
      conversationType: TIM.TYPES.CONV_GROUP, // 群聊
      payload: {
        data: data,
        description: description,
        extension: extension
      }
    });
    // 发送消息
    let promise = tim.sendMessage(message);
    promise.then(function(imResponse) {
      // 发送成功
      console.log('视频问诊发送自定义消息成功:' + JSON.stringify(imResponse));
    }).catch(function(imError) {
      // 发送失败
      // console.warn('视频问诊发送自定义消息失败:', JSON.stringify(imError));
    });
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function() {
    // console.log('room.js onHide');
  },

  /**
   * 进入房间
   */
  joinRoom: function() {
    let that = this;
    that.setData({
      userID: app.globalData.personInfo.keyID, // [必选]用户 ID，可以由您的服务指定，或者使用小程序的openid
      sdkAppID: that.data.sdkAppID, // [必选]开通实时音视频服务创建应用后分配的 sdkAppID
      roomID: that.data.roomID, // [必选]房间号，可以由您的服务指定
      userSig: genTestUserSig(app.globalData.personInfo.keyID).userSig /*that.data.userSig*/ , // [必选]身份签名，需要从自行搭建的签名服务获取
      privateMapKey: '' // 一般不需要填
    }, function() {
      // 开始推流
      this.data.webrtcroomComponent.start();
    })
  },

  /**
   * 退出房间
   */
  exitRoom: function() {
    let that = this;
    that.data.webrtcroomComponent.stop();
  },

  /**
   * 开启（或关闭）本地声音采集
   */
  changeMute: function(isMuteMute) {
    let that = this;
    this.data.muted = isMuteMute; // true or false
    this.setData({
      muted: this.data.muted
    });
  },

  /**
   * 开启（或关闭）本地视频采集
   */
  enableCamera: function(isEnableCamera) {
    let that = this;
    this.setData({
      enableCamera: this.data.enableCamera
    });
  },

  /**
   * 切换摄像头
   */
  changeCamera: function() {
    let that = this;
    this.data.webrtcroomComponent.switchCamera();
  },

  /**
   * 取消、挂断视频
   */
  hangUpVideo: function(e) {
    let that = this;
    if (that.data.isCanCalling) {
      let index = e.currentTarget.dataset.index;
      // index => 0:主动发起视频请求   1:被动接收视频请求
      if (index == 0) {
        if (!that.data.roomID) { // 取消
          let dataParams = {
            customType: "sys",
            childType: "video",
            data: {
              bizId: "tmc",
              type: "cancel",
              requestRole: "0"
            }
          };
          let msgPayload = {
            data: JSON.stringify(dataParams),
            description: "[视频问诊消息]",
            extension: 'tmc'
          };
          that.sendCustomMsg(msgPayload);
          // 主动发起视频后，取消 =》 修改响应状态
          let type = 4; // 0:待接诊 1:已接诊 2:未响应 3:拒绝 4:取消
          that.updateInqueryStateFun(type);
          // that.goBack();
        } else { // 挂断
          let dataParams = {
            customType: "sys",
            childType: "video",
            data: {
              bizId: "tmc",
              type: "hangUp",
              requestRole: "0"
            }
          };
          let msgPayload = {
            data: JSON.stringify(dataParams),
            description: "[视频问诊消息]",
            extension: 'tmc'
          };
          that.sendCustomMsg(msgPayload);
          that.exitRoom();
          that.goBack();
        }
      } else {
        let dataParams = {};
        if (that.data.roomID) { // 挂断
          dataParams = {
            customType: "sys",
            childType: "video",
            data: {
              bizId: "tmc",
              type: "hangUp",
              requestRole: "0"
            }
          };
        } else { // 拒绝
          dataParams = {
            customType: "sys",
            childType: "video",
            data: {
              bizId: "tmc",
              type: "reject",
              requestRole: "0"
            }
          };
        }
        let msgPayload = {
          data: JSON.stringify(dataParams),
          description: "[视频问诊消息]",
          extension: 'tmc'
        };
        that.sendCustomMsg(msgPayload);
        if (that.data.isInCalling) {
          console.log("===挂断视频===");
          that.endVideoInquiryFun(); // 被动接受视频后，挂断 =》结束问诊
        } else {
          console.log("===拒绝视频===");
          // 被动接收视频，拒绝 =》 修改响应状态
          let type = 3; // 0:待接诊 1:已接诊 2:未响应 3:拒绝 4:取消
          that.updateInqueryStateFun(type);
          // that.goBack();
        }
        that.exitRoom();
      }
    }
  },

  /**
   * 返回上一页
   */
  goBack() {
    wx.navigateBack({});
  },

  onLoad: function(options) {
    // console.log("===options===" + JSON.stringify(options));
    let that = this;
    this.data.webrtcroomComponent = this.selectComponent('#myroom');
    /**
     * 收消息
     */
    let myUsername = wx.getStorageSync("myUsername");
    msgStorage.on("newChatMsg", function(renderableMsg, type, curChatMsg, sesskey) {
      console.log("分发到视频界面消息:" + JSON.stringify(renderableMsg));
      // msgType
      let msgType = renderableMsg.type;
      // console.log("msg{Type}:" + msgType);
      if (msgType == "TIMCustomElem") { // 自定义消息
        let jsonData = JSON.parse(renderableMsg.payload.data);
        // customType
        let customType = jsonData.customType;
        // childType
        let childType = jsonData.childType;
        console.log("payload.data.{childType}:" + childType);
        // data
        let data = jsonData.data;
        console.log("payload{data}:" + JSON.stringify(data));
        // 视频问诊的消息类型处理
        if (childType == "video") {
          // 是否接收还是拒绝
          let isaccept = jsonData.data.type;
          console.log("payload.data.data.{type}:" + isaccept);
          if (isaccept == "reject") { // 对方拒绝
            // 退出房间
            wx.showToast({
              title: "医生忙碌中",
              icon: "none",
              duration: 2000
            });
            that.exitRoom(); // 停止上传影像
            setTimeout(function() {
              that.goBack(); // 返回聊天页
            }, 2000);
          } else if (isaccept == "accept") { // 对方接收
            // wx.showToast({
            //   title: "医生已接听",
            //   icon: "none",
            //   duration: 2000
            // });
            // 房间号
            let roomid = jsonData.data.roomId;
            console.log("payload.data.data.{roomId}:" + roomid);
            that.setData({
              roomID: roomid
            });
            if (roomid) {
              that.setData({
                isInCalling: true
              });
              // 进入房间
              that.joinRoom();
            }
          } else if (isaccept == "hangUp" || isaccept == "cancel") { // 对方挂断
            wx.showToast({
              title: "医生已挂断",
              icon: "none",
              duration: 2000
            });
            that.exitRoom(); // 停止上传影像
            setTimeout(function() {
              that.goBack(); // 返回聊天页
            }, 2000);
          }
        }
      }
    });

    /**
     * 获取基础信息
     */
    wx.getStorage({
      key: 'personInfo',
      success: function(res) {
        // 获取患者信息
        that.setData({
          userInfo: res.data
        });
        console.log("===患者信息===" + JSON.stringify(that.data.userInfo));
        wx.getStorage({
          key: 'userSig',
          success: function(res) {
            // 获取userSig
            that.setData({
              userSig: res.data
            });
            console.log("===userSig===" + JSON.stringify(res.data));
            wx.getStorage({
              key: 'inquiryInfo',
              success: function(res) {
                // 获取inquiryInfo
                that.setData({
                  inquiryInfo: res.data
                });
                console.log("===获取群聊问诊信息===" + JSON.stringify(res.data));
              },
            });
            wx.getStorage({
              key: 'doctorInfo',
              success: function(res) {
                that.setData({
                  doctorInfo: res.data
                });
              },
            });
            console.log("===获取doctorInfo===" + JSON.stringify(res.data));
          },
        })
      },
    });

    if (options.isCall == 1) { // 主动发起
      that.setData({
        isHiddenAcceptInterface: true,
        // isAcceptCall: true,
        isHiddenCallInterface: false,
      })
      that.callVideo();
    } else if (options.isCall == 2) { // 接收发起
      that.setData({
        isHiddenAcceptInterface: false,
        // isAcceptCall: true,
        isHiddenCallInterface: true,
        inquiryId: options.inquiryID,
      });
      console.log("===inquiryID===" + that.data.inquiryID + "," + options.inquiryID);
    }
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function() {
    // 设置房间标题
    wx.setNavigationBarTitle({
      title: '视频问诊'
    });
  },

  /**
   * 主动发起
   */
  callVideo: function() {
    let that = this;
    that.setData({
      hidden: false
    });
    // 创建问诊   
    that.createVideoInquiry();
  },

  /**
   * 接听视频
   */
  acceptVideo: function() {
    let that = this;
    that.setData({
      hidden: true,
      isInCalling: true
    });
    that.getRoomId();
    let params = {
      clientUserID: that.data.inquiryInfo.keyID, // 聊天问诊ID
      keyID: that.data.inquiryId, // 视频问诊ID
      doctorID: that.data.userInfo.doctorStaffID // 患者ID
    };
    HTTP.changeDocResponseInquiry(params).then(res => {
      // console.log("接听视频，修改响应时间成功");
    });
  },

  // 获取roomId
  getRoomId: function() {
    let that = this;
    let prams = {
      inquiryId: that.data.inquiryId, // 问诊记录id	
      sponsorsId: that.data.userInfo.keyID, // 发起者id(患者id)
      // receiverId: wx.getStorageSync('doctorInfo').keyID // 接受者id(医生id)
      receiverId: that.data.userInfo.doctorStaffID
    };
    console.log("获取roomId参数:inquiryId:" + that.data.prams);
    HTTP.getRoomId(prams).then(res => {
      console.log("获取roomId:" + JSON.stringify(res));
      that.setData({
        roomID: res.data.roomId,
        receiverStreamId: res.data.receiverStreamId,
        sponsorsStreamId: res.data.sponsorsStreamId
      });
      // 发送问诊ID
      // 发送自定义消息通知医生
      let dataParams = {
        customType: "sys",
        childType: "video",
        data: {
          roomId: res.data.roomId,
          bizId: "tmc",
          type: "accept",
          requestRole: "0",
          receiverStreamId: that.data.receiverStreamId,
          sponsorsStreamId: that.data.sponsorsStreamId
        }
      };
      let msgPayload = {
        data: JSON.stringify(dataParams),
        description: "[视频问诊消息]",
        extension: 'tmc'
      };
      that.sendCustomMsg(msgPayload);
      that.joinRoom();
    })
  },

  /**
   * 操作：取消、拒绝视频时，修改响应状态
   */
  updateInqueryStateFun: function(type) {
    let that = this;
    let params = {
      clientUserID: that.data.inquiryInfo.keyID, // 聊天问诊ID
      inquiryType: type, // 状态 =》 0:待接诊 1:已接诊 2:未响应 3:拒绝 4:取消
      keyID: that.data.inquiryId, // 视频问诊ID
      // doctorID: that.data.doctorInfo.keyID // 医生ID
      doctorID: that.data.userInfo.doctorStaffID
    };
    HTTP.updateDocInquiryType(params).then(res => {
      // console.log("主动拨打的取消或拒绝接听视频，修改响应状态成功");
      that.goBack();
    }).catch((err) => {
      console.log(err)
      that.goBack();
    });
  },

  /**
   * 操作：挂断视频时，结束问诊
   */
  endVideoInquiryFun: function() {
    let that = this;
    let params = {
      clientUserID: that.data.inquiryInfo.keyID, // 聊天问诊ID
      keyID: that.data.inquiryId, // 视频问诊ID
      // doctorID: that.data.doctorInfo.keyID // 医生ID
      doctorID: that.data.userInfo.doctorStaffID
    };
    HTTP.endVideoInquiry(params).then(res => {
      console.log(res);
      console.log("挂断视频，结束问诊成功");
      that.goBack();
    }).catch((err) => {
      console.log(err);
      that.goBack();
    });
  }
})