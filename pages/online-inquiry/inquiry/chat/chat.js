const app = getApp();
const recorderManager = wx.getRecorderManager();
var HTTP = require('../../../../utils/http-util');
import {
  onShareAppMessageFun
} from '../../../../utils/common.js';
var msgStorage = require("../../../../utils/msgstorage");
import {
  heartFun,
  intervalTime
} from '../../../../utils/heart.js';
var tim = app.globalData.tim;
var TIM = app.globalData.TIM;

Page({

  /**
   * 页面的初始数据
   */
  data: {
    count: 0,
    currentType: '1',
    chatInfo: {},
    currentChatID: '',
    isAddAddress: false,
    isEditAddress: false,
    couponData: {},
    timer: null,
    pageName: '问诊页',
    toView: "", // 手机屏幕自动滚动到达的位置
    userInfo: {}, // 当前用户信息
    wexinInfo: {}, // 当前用户微信信息
    doctorInfo: {}, // 医生信息<主要是拿到职称>
    // 多方对话对话信息
    talkInfo: {
      doctorInfo: {}, // 医生信息详情
      assistantInfo: {}, // 医助信息详情
      patientInfo: {}, // 患者信息详情
      multiTalkInfo: {} // 三者ID信息
    },
    // 对话成员信息
    multiTalkMemberInfo: {},
    inquiryInfo: {}, // 问诊信息 
    username: {
      type: Object,
      value: {},
    },
    currentMessageList: [], // 聊天列表信息
    nextReqMessageID: "", // 用于续拉，分页续拉时需传入该字段
    isCompleted: false, // 表示是否已经拉完所有消息
    httpLoading: false, // 是否请求中
    maySendContent: "", // 输入的聊天内容
    maySendContentSure: false, // 是否允许发送的内容格式
    isOpenBottomBoolbar: false, // 是否打开工具栏
    // 底部菜单栏 
    toolbarMenus: [{
        title: "图片",
        iconUrl: "/images/chat/m-image.png",
        clickFun: "chooseWxImage",
        isFifth: false
      },
      {
        title: "拍照",
        iconUrl: "/images/chat/m-camera.png",
        clickFun: "cameraWxFun",
        isFifth: false
      },
      //  {
      //   title: "视频问诊",
      //   iconUrl: "/images/chat/m-video.png",
      //   clickFun: "videoWxFun",
      //   isFifth: false
      // }, 
      {
        title: "开处方",
        iconUrl: "/images/chat/m-rp.png",
        clickFun: "rpWxFun",
        isFifth: false
      }
    ],
    aimgurl: {}, //临时图片的信息
    countIndex: 1, // 可选图片剩余的数量
    hidden: true, // 加载中是否隐藏
    isShowLoading: true, // 发送中是否显示
    scrollTop: 0, // 内容底部与顶部的距离
    isSendRecord: false,
    recordingTxt: "按住 说话",
    startPoint: {}, // 手指触摸屏幕的位置
    sendRecordLock: true, // 是否允许发送语音
    animated: true, // loading加载框动画
    innerAudioContext: null, // 音频播放事件
    recordIndex: "", // 播放的音频的下标
    recordFileUrl: "", // 播放的音频文件的路径
    recordIconUrlSelf: "../../../../images/chat/audioSelf.png", // 语音消息的图标 => 自己发的
    recordIconUrlOthers: "../../../../images/chat/audio.png", // 语音消息的图标 => 他人发的
    recordIconClickedUrlSelf: "../../../../images/chat/audioGifSelf.gif", // 播放语音时的GIF => 自己发的
    recordIconClickedUrlOthers: "../../../../images/chat/audioGif.gif", // 播放语音时的GIF => 他人发的
    isOverChat: false, // 是否结束了问诊
    statusBarHeight: app.globalData.systemInfo.statusBarHeight,
    navBarHeight: app.globalData.navBarHeight,
    isInGroup: false, // 是否已入群
    getGroupListSum: 5, // 检验是否入群循环的最大次数
    sendType: "", // 消息发送类型
    // systemInfo: {}, // 当前手机类型相关信息
    historyInquiryList: [], // 历史问诊ID列表
    historyInquiryIndex: 0, // 查询到的历史问诊ID下标
    orderInfo: null
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // if(options.currentType==='2'){
    //   this.setData({
    //     currentType: 2
    //   })
    // }
  },

  /**
   * 问诊选择 a
   */
  handleCk(e) {
    let index = e.currentTarget.dataset.index
    this.setData({
      currentType: index
    })
    if (index === '2') {
      this.setData({
        historyInquiryList: [],
        currentMessageList: [],
        currentChatID: 'p-' + this.data.inquiryInfo.keyID,
        count: 0
      });
      this.initPrivateMsgList('p-' + this.data.inquiryInfo.keyID)
    } else {
      this.setData({
        historyInquiryList: [],
        currentMessageList: [],
        currentChatID: this.data.inquiryInfo.keyID
      });
      this.getPersonInfo();
    }
  },
  initPrivateMsgList(conversationID) {
    conversationID = "GROUP" + conversationID;
    let that = this
    tim.getMessageList({
        conversationID,
        count: 15
      })
      .then((res) => {
        this.setData({
          currentMessageList: res.data.messageList || []
        });
        that.toViewBottomFun();
      })
      .catch((err) => {});
  },
  /**
   * 去问诊订单页面
   */
  handleGoManage() {
    wx.navigateTo({
      url: `/pages/inquiryManage/inquiryManage?data=${JSON.stringify(this.data.talkInfo)}`,
    });
  },
  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    this.chatInfo = JSON.parse(wx.getStorageSync("chatInfo"))
    let that = this;
    console.log(that.data.currentType)
    if (that.data.currentType == '2') {
      that.setData({
        historyInquiryList: [],
        currentMessageList: [],
        currentChatID: 'p-' + that.data.inquiryInfo.keyID,
        count: 0
      });
      that.initPrivateMsgList('p-' + that.data.inquiryInfo.keyID)
    }
    that.getPersonInfo(); // 从storage中获取患者信息
    that.couponRefs = that.selectComponent("#chatCouponDialog");
    let innerAudioContext = wx.createInnerAudioContext();
    that.setData({
      innerAudioContext: innerAudioContext,
      chatInfo: this.chatInfo
    });
    innerAudioContext.onPlay(() => {
      // 录音播放中时
    });
    innerAudioContext.onStop(() => {
      // 录音播放停止时
      that.initItemRecordStatusFun();
    });
    innerAudioContext.onEnded(() => {
      // 录音播放结束时
      that.initItemRecordStatusFun();
    });
    innerAudioContext.onError(() => {
      // 录音播放错误时
      that.initItemRecordStatusFun();
    });
    let myUsername = wx.getStorageSync("myUsername");
    msgStorage.on("newChatMsg", function (renderableMsg, type, curChatMsg, sesskey) {
      console.log("收到新消息：" + JSON.stringify(renderableMsg));
      let conversationID = renderableMsg.conversationID
      if(renderableMsg && renderableMsg.type==='TIMCustomElem' && renderableMsg.payload.description==='tmc结束问诊'){
        wx.navigateTo({
          url: '/pages/index/index',
        })
      }
      if (renderableMsg && renderableMsg.type && conversationID.replace('GROUP', '') == that.data.currentChatID) {
        let msgType = renderableMsg.type;
        if (msgType == "TIMSoundElem") { // 语音消息
          renderableMsg.recordStatus = false; // 播放状态
          if (Number(renderableMsg.payload.second) <= 15) {
            renderableMsg.recordViewWidth = renderableMsg.payload.second * 12 + 100; // 最大宽度不超过370,最小宽度要大于100
          } else {
            renderableMsg.recordViewWidth = (Number(renderableMsg.payload.second) - 15) * 2 + 280; // 最大宽度不超过420,最小宽度要大于100
          }
        } else if (msgType == "TIMCustomElem") {
          // 自定义消息
          // let msgType = renderableMsg.type;
          if (msgType == "TIMCustomElem") { // 自定义消息
            let jsonData = JSON.parse(renderableMsg.payload.data);
            let customType = jsonData.customType;
            let childType = jsonData.childType;
            // 视频问诊的消息类型处理
            if (childType == "video") {
              // 医生发起(接收视频)
              // if (jsonData.data.requestRole == 1 && jsonData.data.inquiryId) {
              //   let inquiryType = jsonData.data.type;
              //   that.videoWxFun(jsonData.data.inquiryId);
              // };
            }
            // 结束问诊、创建问诊
            if (customType == "sys" && jsonData.data.talkID == that.data.talkInfo.multiTalkInfo.keyID) {
              if (renderableMsg.to == that.data.currentChatID && childType == "endTMCInquiry") {
                
                // 结束问诊
                that.setData({
                  isOverChat: true,
                  inquiryInfo: {},
                  isSendRecord: false,
                  isOpenBottomBoolbar: false
                });
                wx.hideToast(); // 结束录音、隐藏Toast提示框
                recorderManager.stop();
              } else if (childType == "createTMCInquiry") {
                // 创建问诊
                that.setData({
                  isOverChat: true,
                  inquiryInfo: {
                    keyID: jsonData.data.inquiryID
                  },
                  currentChatID: jsonData.data.inquiryID,
                  isSendRecord: false,
                  isOpenBottomBoolbar: false
                });
                that.createInquiry();
              }
            }
          }
        }
        let nowData = [...that.data.currentMessageList, renderableMsg];
        that.setData({
          currentMessageList: nowData
        });
        if (msgType == "TIMCustomElem") {
          let jsonData = JSON.parse(renderableMsg.payload.data);
          let customType = jsonData.customType;
          let childType = jsonData.childType;
          if (childType != "video") {
            that.toViewBottomFun();
          }
        } else {
          that.toViewBottomFun();
        }
        console.log(that.data.currentType)
        that.setMessageRead();
      }
      if (renderableMsg && renderableMsg.type && conversationID.replace('GROUP', '') == 'p-' + that.data.currentChatID) {
        that.setData({
          count: that.data.count + 1
        })
      }
    });

    this.timer = setInterval(() => {
      heartFun(this.data.pageName, this.__route__)
    }, intervalTime);
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    clearInterval(this.timer)
    msgStorage.off('newChatMsg')
  },
  editAddress(e) {
    let params = {
      orgID: app.globalData.orgID,
      inquiryID: this.data.currentChatID
    }
    if (e.currentTarget.dataset.order.inquiryID) {
      params.inquiryID = e.currentTarget.dataset.order.inquiryID
    }
    HTTP.getOrderDeliveryByInquiryID(params).then(res => {
      if (res.code == 0) {
        this.setData({
          isEditAddress: true,
          orderInfo: e.currentTarget.dataset.order
        })
      } else {
        wx.showToast({
          title: res.message,
          icon: 'none'
        })
      }
    })
  },
  closeEditAddress() {
    this.setData({
      isEditAddress: false,
      orderInfo: null
    })
  },
  addAddress() {
    this.setData({
      isEditAddress: false,
      isAddAddress: true
    })
  },
  closeAddAddress() {
    this.setData({
      isEditAddress: true,
      isAddAddress: false
    })
  },
  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    this.data.innerAudioContext.stop();
    clearInterval(this.timer)
    msgStorage.off('newChatMsg')
  },
  /**
   * 处理系统消息
   */
  dealSysMessage: function (data) {
    let that = this;
    let childType = data.childType;
    switch (childType) {
      case "video": // 视频问诊消息
        that.dealSysVideoMessage(data);
        break;
    }
  },


  /**
   * 处理视频问诊消息
   */
  dealSysVideoMessage: function (data) {
    let that = this;
    let requestRole = data.requestRole;
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  // 操作：下拉加载数据
  onPullDownRefresh: function (countNum) {
    let that = this;
    // countNum 数字存在时，是初始查询历史消息； 不存在时，是下拉加载历史消息 
    if (countNum) {
      if (that.data.isCompleted) {
        // 没有更多数据了
        return;
      }
      let count = 15 - countNum;
      tim.getMessageList({
        conversationID: "GROUP" + that.data.currentChatID,
        nextReqMessageID: that.data.nextReqMessageID,
        count: count
      }).then(function (imResponse) {
        let spliceNum = 0;
        let imResponseArr = [];
        imResponse.data.messageList.forEach(item => {
          let isAddToArr = true;
          if (item.type == "TIMSoundElem") {
            item.recordStatus = false; // 播放状态
            if (Number(item.payload.second) <= 15) {
              item.recordViewWidth = Number(item.payload.second) * 12 + 100; // 最大宽度不超过370,最小宽度要大于100
            } else {
              item.recordViewWidth = (Number(item.payload.second) - 15) * 2 + 280; // 最大宽度不超过370,最小宽度要大于100
            }
          } else if (item.type == "TIMCustomElem") {
            // 自定义消息：有视频问诊消息，就不添加到数组中，然后再次请求相应数量的历史消息
            if (JSON.parse(item.payload.data).childType == "video") {
              isAddToArr = false
              spliceNum = spliceNum + 1;
            }
          }
          if (isAddToArr) {
            imResponseArr.push(item);
          }
        });
        // console.log("获取历史消息记录:" + JSON.stringify(imResponseArr));
        that.setData({
          currentMessageList: [...imResponseArr, ...that.data.currentMessageList],
          nextReqMessageID: imResponse.data.nextReqMessageID,
          isCompleted: imResponse.data.isCompleted
        });
        if (spliceNum && !that.data.isCompleted) {
          that.onPullDownRefresh(spliceNum);
        } else {
          that.toViewBottomFun();
        }
      });
    } else {
      if (that.data.isCompleted) {
        console.log("当前的没了，加载历史的了");
        that.dealHistoryMsg(); // 查询历史问诊的消息记录
      } else {
        wx.showNavigationBarLoading(); //在标题栏中显示加载中的转圈效果
        tim.getMessageList({
          conversationID: "GROUP" + that.data.currentChatID,
          nextReqMessageID: that.data.nextReqMessageID,
          count: 15
        }).then(function (imResponse) {
          imResponse.data.messageList.forEach(item => {
            if (item.type == "TIMSoundElem") {
              item.recordStatus = false; // 播放状态
              if (Number(item.payload.second) <= 15) {
                item.recordViewWidth = Number(item.payload.second) * 12 + 100; // 最大宽度不超过370,最小宽度要大于100
              } else {
                item.recordViewWidth = (Number(item.payload.second) - 15) * 2 + 280; // 最大宽度不超过370,最小宽度要大于100
              }
            }
          })
          setTimeout(function () {
            that.setData({
              currentMessageList: [...imResponse.data.messageList, ...that.data.currentMessageList],
              nextReqMessageID: imResponse.data.nextReqMessageID,
              isCompleted: imResponse.data.isCompleted
            });
            wx.hideNavigationBarLoading(); // 完成数据操作后停止标题栏中的加载中的效果
            wx.stopPullDownRefresh(); // 停止下拉刷新过程
          }, 1000);
        });
      }
    }
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
    return onShareAppMessageFun();
  },

  /*从storage中获取患者信息 */
  getPersonInfo: function () {
    this.getPatientMultiTalk();
    this.setData({
      userInfo: app.globalData.userInfo
    })
    // let that = this;
    // wx.getStorage({
    //   key: "personInfo",
    //   success: function(res) {
    //     console.log(res)
    //     that.setData({
    //       userInfo: res.data
    //     });
    //     if (that.data.userInfo.keyID) {
    //       that.getPatientMultiTalk(); // 查询患者的多方对话
    //     }
    //   }
    // });
    // wx.getStorage({
    //   key: "userInfo",
    //   success: function(res) {
    //     that.setData({
    //       wexinInfo: res.data
    //     });
    //   }
    // });
  },

  /*查询患者的多方对话 */
  getPatientMultiTalk: function () {
    let that = this;
    let params = {
      orgID: that.chatInfo.tmcPatient.orgID,
      patientID: that.chatInfo.multiTalk.patientID,
      doctorStaffID: that.chatInfo.multiTalk.doctorStaffID,
      assistantStaffID: that.chatInfo.multiTalk.assistantStaffID
    };
    HTTP.getPatientMultiTalk(params).then(res => {
      let resData = res.data;
      that.setData({
        talkInfo: {
          doctorInfo: resData.doctor,
          assistantInfo: resData.assistant,
          patientInfo: {
            ...resData.tmcPatient,
            faceImage: resData.patient.faceImage
          },
          multiTalkInfo: resData.multiTalk
        }
      });
      that.setData({
        multiTalkMemberInfo: {
          [that.chatInfo.multiTalk.doctorStaffID]: resData.doctor,
          [that.chatInfo.multiTalk.assistantStaffID]: resData.assistant,
          [that.chatInfo.multiTalk.patientID]: resData.patient
        }
      })
      that.getFetchDoctorInfo(that.chatInfo.multiTalk.doctorStaffID); // 查询医生详情
      that.getFetchAssistantDoctorInfo(that.chatInfo.multiTalk.assistantStaffID); // 查询医助详情
      wx.setStorageSync('doctorInfo', resData.doctor);
      that.setData({
        hidden: false, // 开启加载中
        isOverChat: false
      });
      that.createInquiry(); // 创建问诊
    })
  },

  /*创建问诊 */
  createInquiry: function () {
    let that = this;
    let chatInfo = this.chatInfo
    let params = {
      orgID: chatInfo.tmcPatient.orgID,
      patientID: chatInfo.multiTalk.patientID,
      doctorStaffID: chatInfo.multiTalk.doctorStaffID,
      doctorName: chatInfo.doctor.doctorName,
      assistantStaffID: chatInfo.multiTalk.assistantStaffID,
      assistantName: chatInfo.assistant.doctorName,
      talkID: chatInfo.multiTalk.keyID
    };
    HTTP.createInquiry(params).then(res => {
      if (res.code == 0 && res.data) {
        that.setData({
          inquiryInfo: res.data,
          getGroupListSum: 5, // 检验入群否的最大循环次数
          sendType: "",
          currentChatID: res.data.keyID
        });
        that.isInGroupFun(); // 检验是否成功入群
      }
    }).catch(err => {
      console.log("创建问诊失败：" + JSON.stringify(err));
      that.setData({
        hidden: true,
        isShowLoading: true,
        httpLoading: false,
        sendType: "",
        isOverChat: true
      });
      wx.showToast({
        title: "发起问诊失败",
        icon: "none",
        duration: 2000
      });
    });
  },

  // 操作：结束问诊后，患者主动发消息时，创建问诊
  createInquirySelf: function (type) {
    let that = this;
    let chatInfo = this.chatInfo
    let params = {
      orgID: chatInfo.tmcPatient.orgID,
      patientID: chatInfo.multiTalk.patientID,
      doctorStaffID: chatInfo.multiTalk.doctorStaffID,
      doctorName: that.data.talkInfo.doctorInfo.doctorName,
      assistantStaffID: that.data.userInfo.assistantStaffID,
      assistantName: that.data.talkInfo.assistantInfo.doctorName,
      talkID: that.data.talkInfo.multiTalkInfo.keyID
    };
    HTTP.createInquiry(params).then(res => {
      that.setData({
        inquiryInfo: res.data,
        getGroupListSum: 5, // 检验入群否的最大循环次数
        sendType: type,
        currentChatID: res.data.keyID
      });
      if (type == "contentMSg") {
        that.sendMessageFun(); // 发送文本消息
      } else if (type == "imageFun") {
        that.sendImageMsgFun(); // 发送图片消息
      }
    }).catch(() => {
      that.setData({
        hidden: true,
        isShowLoading: true,
        httpLoading: false,
        sendType: ""
      });
      wx.showToast({
        title: "发起问诊失败",
        icon: "none",
        duration: 2000
      });
    })
  },

  /**检查是否已入群 */
  isInGroupFun: function (type) {
    let that = this;
    if (that.data.getGroupListSum < 1) {
      // 校验入群次数使用完，默认入群成功
      that.dealInGroupSuccess();
      return
    } else {
      that.setData({
        isInGroup: false,
        getGroupListSum: that.data.getGroupListSum - 1
      });
      setTimeout(() => {
        let info = tim.getGroupList(); // 获取所有群ID
        info.then(imResponse => {
          imResponse.data.groupList.forEach((item) => {
            if (item.groupID == that.data.currentChatID) {
              that.setData({
                isInGroup: true
              });
            }
          });
          if (that.data.isInGroup) {
            that.dealInGroupSuccess();
          } else {
            console.log("检验入群结果：入群失败");
            let params = {
              groupID: that.data.currentChatID,
              doctorStaffID: that.data.chatInfo.multiTalk.doctorStaffID,
              assistantStaffID: that.data.chatInfo.multiTalk.assistantStaffID,
              patientID: that.data.chatInfo.multiTalk.patientID
            }
            HTTP.addGroupMember(params).then(res => {
              that.isInGroupFun(); // 检验是否成功入群
            });
          }
        }).catch(err => {
          console.warn('getGroupList error:', err); // 获取群组列表失败的相关信息
        })
      }, 300);
    }
  },
  dealInGroupSuccess() {
    let that = this;
    console.log("入群成功---入群剩余次数---" + that.data.getGroupListSum)
    wx.setStorageSync("inquiryInfo", that.data.inquiryInfo);
    if (that.data.sendType) {
      that.setData({
        isOverChat: false,
        httpLoading: false, // 关闭隐性加载过程
        isShowLoading: true // 隐藏发送中
      });
      if (that.data.sendType == "normalFun") {
        that.setData({
          hidden: true // 隐藏加载中
        });
      } else if (that.data.sendType == "contentMSg") {
        that.sendMessageFun(); // 发送文本消息
      } else if (that.data.sendType == "imageFun") {
        that.sendImageMsgFun(); // 发送图片消息
      } else if (that.data.sendType == "videoFun") {
        that.videoWxFun(); // 拨打视频
      }
      that.setData({
        sendType: ""
      });
    } else {
      if (that.data.isOverChat) {
        that.setData({
          isOverChat: false,
          httpLoading: false, // 关闭隐性加载过程
          isShowLoading: true // 隐藏发送中
        });
      } else {
        that.sendCustomMsgFun(); // 告知系统，患者进入问诊了
        that.getHistoryMessage(); // 获取历史消息
      }
    }
    that.getHistoryInquiryID(); // 查询历史问诊记录ID列表
  },

  /*打开会话时,获取最近消息列表 */
  getHistoryMessage: function () {
    let that = this;
    tim.getMessageList({
      conversationID: "GROUP" + that.data.currentChatID,
      count: 15
    }).then(function (imResponse) {
      let spliceNum = 0;
      let imResponseArr = [];
      imResponse.data.messageList.forEach(item => {
        let isAddToArr = true;
        if (item.type == "TIMSoundElem") {
          // console.log(JSON.stringify(item));
          item.recordStatus = false; // 播放状态
          if (Number(item.payload.second) <= 15) {
            item.recordViewWidth = item.payload.second * 12 + 100; // 最大宽度不超过370,最小宽度要大于100
          } else {
            item.recordViewWidth = (Number(item.payload.second) - 15) * 2 + 280; // 最大宽度不超过370,最小宽度要大于100
          }
        } else if (item.type == "TIMCustomElem") {
          // 自定义消息：有视频问诊消息，就不添加到数组中，然后再次请求相应数量的历史消息
          if (JSON.parse(item.payload.data).childType == "video") {
            isAddToArr = false
            spliceNum = spliceNum + 1;
          }
        } else if (item.type == "TIMImageElem") {
          // console.log(JSON.stringify(item));
        }
        if (isAddToArr) {
          imResponseArr.push(item);
        }
      })
      that.setData({
        currentMessageList: imResponse.data.messageList,
        nextReqMessageID: imResponse.data.nextReqMessageID,
        isCompleted: imResponse.data.isCompleted
      });
      if (that.data.currentType == '2') {
        that.setData({
          historyInquiryList: [],
          currentMessageList: [],
          currentChatID: 'p-' + that.data.inquiryInfo.keyID,
          count: 0
        });
        that.initPrivateMsgList('p-' + that.data.inquiryInfo.keyID)
      }
      that.setMessageRead()
      if (spliceNum && !that.data.isCompleted) {
        that.onPullDownRefresh(spliceNum);
      } else {
        that.toViewBottomFun();
      }
    }).catch(function (imError) {
      that.setData({
        hidden: true
      });
      console.log(imError);
    });
  },

  /*打开会话时,消息设置成已读 */
  setMessageRead: function () {
    let that = this;
    // 将某会话下所有未读消息已读上报
    tim.setMessageRead({
      conversationID: "GROUP" + that.data.currentChatID
    });
  },

  /*自动：滚动到消息底部 */
  toViewBottomFun: function () {
    // 设置屏幕自动滚动到最后一条消息处
    let that = this;
    wx.createSelectorQuery().select('#viewCommunicationBody').boundingClientRect(function (rect) {
      wx.pageScrollTo({
        scrollTop: rect.height,
        duration: 100
      })
      that.setData({
        hidden: true,
        scrollTop: rect.height - that.data.scrollTop
      });
    }).exec();
  },

  /**获取主治医师员工信息*/
  getFetchDoctorInfo(staffID) {
    let that = this;
    HTTP.getDoctorInfo({
        staffID: staffID
      })
      .then(res => {
        if (res.code == 0 && res.data) {
          that.setData({
            ["talkInfo.doctorTitleName"]: res.data.titleName,
            doctorInfo: res.data
          });
        }
      });
  },

  /**获取助理医生员工信息 */
  getFetchAssistantDoctorInfo(staffID) {
    let that = this;
    HTTP.getDoctorInfo({
      staffID: staffID
    }).then(res => {
      if (res.code == 0 && res.data) {
        that.setData({
          ["talkInfo.assistTitleName"]: res.data.titleName
        });
      }
    })
  },

  /*操作： 点击医生查看详情 */
  doctorDetailTap: function (e) {
    var index = e.currentTarget.dataset.index
    var doctorStaffID = index == '0' ? wx.getStorageSync('personInfo').doctorStaffID : wx.getStorageSync('personInfo').assistantStaffID
    wx.navigateTo({
      url: '/pages/online-inquiry/doctor-details/doctor-details?staffID=' + doctorStaffID,
      success: function (res) {},
      fail: function (res) {},
      complete: function (res) {},
    })
  },

  /*操作：点击输入框时，关闭工具栏  */
  inputClickedFun: function () {
    // let that = this;
    // if (that.data.systemInfo.platform == "android" && that.data.isOpenBottomBoolbar) {
    //   this.setData({
    //     isOpenBottomBoolbar: false
    //   });
    // }
  },

  /*操作：键盘高度变化时 */
  menusInputHeightChangeFun: function (e) {

  },

  /*操作：输入框聚焦*/
  menusInputFocusFun: function (e) {
    // let that = this;
    // if (that.data.systemInfo.platform == "ios" && that.data.isOpenBottomBoolbar) {
    //   this.setData({
    //     docInfoBoxTop: e.detail.height + 30
    //   });
    // } else {
    //   this.setData({
    //     docInfoBoxTop: e.detail.height * 2
    //   });
    // }
  },

  /*操作：消息输入框失去焦点时 */
  menusInputBlurFun: function (e) {
    // this.setData({
    //   docInfoBoxTop: 0
    // });
  },

  /*操作：输入预发送信息 */
  adInputChange: function (e) {
    let that = this;
    that.setData({
      maySendContent: e.detail.value,
    });
    let value = that.data.maySendContent; // 先把输入的值复制一份，用于操作
    value = value.replace(/\s+/g, ""); // 用正则表达式去掉所有的空白字符（空格是其中一种）
    //去掉所有空格之后，再对它进行判断，  
    //如果字符串中还有别的内容，说明输入的内容不是空格，则可以发送
    if (value != "") {
      that.setData({
        maySendContentSure: true
      });
    } else {
      that.setData({
        maySendContentSure: false
      });
    }
  },

  /*操作：预发送（文本消息） */
  sendContentMsg: function (e) {
    let that = this;
    if (that.data.httpLoading || !that.data.maySendContent) {
      return;
    }
    that.setData({
      httpLoading: true, // 开启隐性加载过程
      isShowLoading: false // 显示发送中
    });
    if (that.data.isOverChat) {
      let type = "contentMSg";
      that.createInquirySelf(type);
    } else {
      that.sendMessageFun();
    }
  },

  /*操作：发送（文本消息） */
  sendMessageFun: function () {
    let that = this;
    // 1. 创建消息实例，接口返回的实例可以上屏 createInquiry

    let message = tim.createTextMessage({
      //to: that.data.inquiryInfo.keyID, // 群ID
      to: that.data.currentChatID, // 群ID
      conversationType: TIM.TYPES.CONV_GROUP, // 群聊
      payload: {
        text: that.data.maySendContent
      }
    });
    let nowData = [...that.data.currentMessageList, message];
    let oldmaySendContent = that.data.maySendContent;
    that.data.maySendContent = ''
    setTimeout(function () {
      that.setData({
        currentMessageList: nowData,
        maySendContent: "",
        maySendContentSure: false,
        isOpenBottomBoolbar: false,
        httpLoading: false, // 关闭隐性加载过程
        isShowLoading: true // 隐藏发送中
      });
      that.toViewBottomFun();
    }, 50)
    // 2. 发送消息
    tim.sendMessage(message).then(function (imResponse) {
      console.log("发送文本消息成功");
    }).catch(function (imError) {
      console.log('发送文本消息失败：', imError);
      wx.showToast({
        title: "发送消息： '" + oldmaySendContent + "' 失败",
        icon: "none",
        duration: 2000
      });
      let nowData = [...that.data.currentMessageList];
      if (nowData.length > 0) {
        nowData = nowData.splice(nowData.length - 1, 1);
      }
      that.setData({
        currentMessageList: nowData
      });
      that.toViewBottomFun();
    });
  },

  /*操作：打开、关闭 底部工具栏 */
  isOpenBottomBoolbarFun: function () {
    let that = this;
    that.setData({
      isOpenBottomBoolbar: !that.data.isOpenBottomBoolbar,
      isSendRecord: false
    });
    that.toViewBottomFun();
  },

  /*操作：点击工具栏某功能 */
  toolbarMenusFun: function (e) {
    let that = this;
    let fun = e.currentTarget.dataset.clickfun;
    if (fun == "chooseWxImage") {
      that.chooseWxImage();
    } else if (fun == "cameraWxFun") {
      that.cameraWxFun();
    } else if (fun == "videoWxFun") {
      // 处理一
      // 主动发起不需要传inquiryID;
      if (that.data.isOverChat) {
        that.setData({
          hidden: false // 显示加载中
        });
        let type = "videoFun";
        that.createInquirySelf(type);
      } else {
        that.videoWxFun();
      }

      // 处理二
      // 提示用户：发消息联系医生医助，想要与医生进行视频问诊。
      // wx.showToast({
      //   title: "您可发消息联系医生助理为您预约视频问诊",
      //   icon: "none",
      //   duration: 2000
      // });
    } else if (fun == 'rpWxFun') {
      wx.navigateTo({
        url: `/pages/prescribe/prescribe?data=${JSON.stringify(this.data.inquiryInfo)}`,
      });
    }
  },

  /*操作：打开相册*/
  chooseWxImage: function () {
    let that = this;
    wx.chooseImage({
      count: that.data.countIndex,
      sizeType: ['original', 'compressed'],
      sourceType: ["album"],
      success: function (res) {
        let tempFilePaths = res.tempFilePaths;
        that.setData({
          aimgurl: res
        });
        that.sendImageMsg();
      }
    })
  },

  /*操作：打开相机 */
  cameraWxFun: function () {
    let that = this;
    wx.chooseImage({
      count: that.data.countIndex,
      sizeType: ['original', 'compressed'],
      sourceType: ["camera"],
      success: function (res) {
        let tempFilePaths = res.tempFilePaths;
        that.setData({
          aimgurl: res
        });
        that.sendImageMsg();
      }
    })
  },

  /*操作：预发送（图片消息） */
  sendImageMsg: function () {
    let that = this;
    if (that.data.httpLoading) {
      return;
    }
    that.setData({
      httpLoading: true, // 开启隐性加载过程
      isShowLoading: false // 显示发送中
    });
    if (that.data.isOverChat) {
      let type = "imageFun";
      that.createInquirySelf(type);
    } else {
      that.sendImageMsgFun();
    }
  },

  /*操作：发送图片*/
  sendImageMsgFun: function () {
    let that = this;
    // 1. 创建消息实例
    const message = tim.createImageMessage({
      to: that.data.currentChatID, // 群ID
      conversationType: TIM.TYPES.CONV_GROUP, // 群聊
      payload: {
        file: that.data.aimgurl
      }
    });
    message.showLoadingState = true;
    let nowData = [...that.data.currentMessageList, message];
    that.setData({
      currentMessageList: nowData
    });
    that.toViewBottomFun();
    // 2. 发送数据
    tim.sendMessage(message).then(function (imResponse) {
      let nowDatas = [...that.data.currentMessageList, message];
      nowDatas[nowDatas.length - 1].showLoadingState = false;
      that.setData({
        currentMessageList: nowDatas,
        isOpenBottomBoolbar: false,
        httpLoading: false, // 关闭隐性加载过程
        isShowLoading: true // 隐藏发送中
      });
      console.log("发送图片消息成功");
      that.toViewBottomFun();
    }).catch(function (imError) {
      console.log("发送图片失败" + JSON.stringify(imError));
      that.setData({
        httpLoading: false, // 关闭隐性加载过程
        isShowLoading: true // 隐藏发送中
      });
      wx.showToast({
        title: "发送图片失败",
        icon: "none",
        duration: 2000
      });
      let nowData = [...that.data.currentMessageList];
      if (nowData.length > 0) {
        nowData = nowData.splice(nowData.length - 1, 1);
      }
      that.setData({
        currentMessageList: nowData
      });
      that.toViewBottomFun();
    });
  },

  /*操作：点击单张图片*/
  previewImage(e) {
    let url = e.currentTarget.dataset.imagesrc;
    wx.previewImage({
      current: url,
      urls: [url]
    })
  },

  /*操作：切换为键盘 */
  openKeyboardFun: function () {
    let that = this;
    if (that.data.isOverChat) {
      that.setData({
        hidden: false // 显示加载中
      });
      let type = "normalFun";
      that.createInquirySelf(type);
    }
    that.setData({
      isSendRecord: false,
      isOpenBottomBoolbar: false
    });
  },

  /*操作：切换为语音 */
  willSendRecordMsg: function () {
    let that = this;
    that.setData({
      isSendRecord: true,
      isOpenBottomBoolbar: false
    });
    if (that.data.isOverChat) {
      that.setData({
        hidden: false // 显示加载中
      });
      let type = "normalFun";
      that.createInquirySelf(type);
    }
  },

  /*操作：开始长按录音按钮 */
  handleTouchStart: function (e) {
    let that = this;
    wx.getSetting({
      success(res) {
        if (!res.authSetting['scope.record']) {
          wx.hideToast(); // 结束录音、隐藏Toast提示框
          recorderManager.stop();
          recorderManager.onStop(function (res) {});
          wx.showToast({
            title: "您未允许本小程序语音授权，无法发送语音",
            icon: "none",
            duration: 3000
          });
        } else {
          that.startRecordMsg();
          that.setData({
            startPoint: e.touches[0],
            recordingTxt: "松开 结束",
            sendRecordLock: true
          });
        }
      }
    });
  },

  /*操作：结束长按录音按钮 */
  handleTouchEnd: function (e) {
    this.stopRecordMsg();
    this.setData({
      recordingTxt: "按住 说话"
    });
  },

  /*操作：点击了长按录音按钮 */
  handleClick: function (e) {

  },

  /*操作：长按录音按钮过程中 */
  handleLongPress: function (e) {},
  /*操作：滑动取消 */
  handleMove: function (e) {
    let that = this;
    let moveLenght = e.touches[e.touches.length - 1].clientY - that.data.startPoint.clientY; // 手指移动距离
    if (Math.abs(moveLenght) > 50) {
      wx.showToast({
        title: "松开手指,取消发送",
        icon: "none",
        duration: 60000
      });
      // 触发了上滑取消发送，上锁
      that.setData({
        sendRecordLock: false
      });
    } else {
      wx.showToast({
        title: "正在录音，上划取消发送",
        icon: "none",
        duration: 60000
      });
      // 上划距离不足，依然可以发送，不上锁
      that.setData({
        sendRecordLock: true
      });
    }
  },
  /*操作：长按录制语音消息 */
  startRecordMsg: function () {
    // 示例：使用微信官方的 RecorderManager 进行录音，参考 RecorderManager.start(Object object)
    // 1. 获取全局唯一的录音管理器 RecorderManager
    // 录音部分参数
    const recordOptions = {
      duration: 60000, // 录音的时长，单位 ms，最大值 600000（10 分钟）
      sampleRate: 44100, // 采样率
      numberOfChannels: 1, // 录音通道数
      encodeBitRate: 192000, // 编码码率
      format: "aac" // 音频格式，选择此格式创建的音频消息，可以在即时通信 IM 全平台（Android、iOS、微信小程序和 Web）互通
    };
    wx.showToast({
      title: "正在录音，上划取消发送",
      icon: "none",
      duration: 60000 // 先定义个60秒，后面可以手动调用wx.hideToast()隐藏
    });
    // 2.开始录音
    recorderManager.start(recordOptions);
    recorderManager.onStart(() => {});
    // 3.监听录音错误事件
    recorderManager.onError(function (errMsg) {
      console.warn(errMsg);
    });
  },

  /*操作：停止录音并发送 */
  stopRecordMsg: function () {
    let that = this;
    wx.hideToast(); // 结束录音、隐藏Toast提示框
    recorderManager.stop();
    recorderManager.onStop(function (res) {
      if (res.duration < 1000) {
        wx.showToast({
          title: "录音时间太短",
          icon: "none",
          duration: 1000
        });
      } else if (that.data.sendRecordLock) {
        // 4. 创建消息实例，接口返回的实例可以上屏
        const message = tim.createAudioMessage({
          to: that.data.currentChatID,
          conversationType: TIM.TYPES.CONV_GROUP,
          payload: {
            file: res
          }
        });
        message.recordStatus = false; // 播放状态
        if (Number(message.payload.second) <= 15) {
          message.recordViewWidth = message.payload.second * 12 + 100; // 最大宽度不超过370,最小宽度要大于100
        } else {
          message.recordViewWidth = (Number(message.payload.second) - 15) * 2 + 280; // 最大宽度不超过370,最小宽度要大于100
        }
        let nowData = [...that.data.currentMessageList, message];
        that.setData({
          currentMessageList: nowData,
          maySendContent: ""
        });
        that.toViewBottomFun();
        // 5. 发送消息
        tim.sendMessage(message).then(function (imResponse) {
          // 发送成功
          console.log("发送语音消息成功");
        }).catch(function (imError) {
          // 发送失败
          console.log("发送语音消息失败" + imError);
          wx.showToast({
            title: "发送语音消息失败",
            icon: "none",
            duration: 2000
          });
        });
      }
    });
  },

  /*操作：播放语音 */
  playRecordFun: function (e) {
    let that = this;
    wx.stopVoice(); // 停止播放所有音频
    that.initItemRecordStatusFun();
    let recordurl = e.currentTarget.dataset.recordurl; // 获取播放音频的路径
    that.data.innerAudioContext.src = recordurl; // 设置播放音频的路径
    that.setData({
      recordIndex: e.currentTarget.dataset.recordindex // 语音在数组中的下标
    });
    if (recordurl == that.data.recordFileUrl) {
      that.data.innerAudioContext.stop(); // 播放同一个语音时，将其停止
      that.setData({
        recordFileUrl: "",
        ["currentMessageList[" + that.data.recordIndex + "].recordStatus"]: false
      });
    } else {
      that.data.innerAudioContext.play(); //不是同一个语音 直接播放点击的音频，记录此次语音路径
      that.setData({
        recordFileUrl: recordurl,
        ["currentMessageList[" + that.data.recordIndex + "].recordStatus"]: true
      });
    }
  },

  /*操作：初始化音频图标 */
  initItemRecordStatusFun: function () {
    let that = this;
    if (that.data.recordIndex != "") {
      that.setData({
        ["currentMessageList[" + that.data.recordIndex + "].recordStatus"]: false
      });
    }
  },

  /*操作：视频通话 */
  videoWxFun: function (inqID) {
    /**
     * isCall 1主动发起视频
     * isCall 2接收发起视频
     */
    this.setData({
      hidden: true // 隐藏加载中
    });
    let inquiryID = '';
    let isCall = 1;
    if (inqID) {
      inquiryID = inqID;
      isCall = 2;
    };
    wx.navigateTo({
      url: '/pages/online-inquiry/inquiry/video/room?isCall=' + isCall + '&inquiryID=' + inquiryID,
      success: function (res) {},
      fail: function (res) {},
      complete: function (res) {},
    })
    console.log("--------跳转到视频-----------" + inquiryID);
  },

  /*操作：点击消息窗口 */
  clickViewCommunicationFun: function () {
    this.setData({
      isOpenBottomBoolbar: false
    });
  },

  /*操作：点击处方卡片消息查看详情 */
  toRpDetailFun: function (e) {
    let inquiryID = e.currentTarget.dataset.rpid;
    if (inquiryID) {
      let recipe = {
        orgID: app.globalData.userInfo.orgID,
        rpID: inquiryID
      }
      wx.navigateTo({
        url: `../../../prescriptionNotes/prescriptionNotes?recipes=${JSON.stringify(recipe)}`
      });
    }
    // this.simulationToMatFun(); // 模拟跳转到素材
  },

  /*查找：点击素材卡片消息，跳转到对应网址链接*/
  toMaterialFun: function (e) {
    let materialData = e.currentTarget.dataset.materialdata;
    if (materialData) {
      wx.navigateTo({
        url: "/pages/online-inquiry/inquiry/videoPlay/videoPlay?materialData=" + JSON.stringify(materialData) // 传输对象、数组时，需要在赋值处转换为字符窜
      });
    }
  },

  /**患者进入问诊了，告知系统发欢迎语 */
  sendCustomMsgFun() {
    let that = this;
    let params = {
      orgID: that.chatInfo.tmcPatient.orgID,
      patientID: that.chatInfo.tmcPatient.keyID,
      receiver: that.data.currentChatID,
      orgName: that.data.doctorInfo.workPlace,
      assistantStaffID: that.data.talkInfo.multiTalkInfo.assistantStaffID,
      doctorName: that.data.doctorInfo.doctorName
    }
    HTTP.sendCustomMsgPost(params).then(res => {
      console.log("请求欢迎语成功");
    });
  },

  /**获取历史问诊记录 */
  getHistoryInquiryID: function (type) {
    let that = this;
    HTTP.getInquiryIDByTalk({
      orgID: that.data.userInfo.orgID,
      talkID: that.data.talkInfo.multiTalkInfo.keyID
    }).then(res => {
      if (res.code == 0 && res.data) {
        that.setData({
          historyInquiryList: res.data
        });
      }
    });
  },

  /**获取历史问诊的消息记录 */
  dealHistoryMsg() {
    let that = this;
    if (that.data.historyInquiryIndex < that.data.historyInquiryList.length) {
      HTTP.findHistoryMsgByInquiryID({
        pageIndex: 0,
        inquiryID: that.data.historyInquiryList[that.data.historyInquiryIndex].keyID
      }).then(res => {
        if (res.code == 0 && res.data) {
          if (res && res.data) {
            // 当前问诊也需要从mongo中获取历史记录
            if (that.data.historyInquiryIndex === 0 && that.data.currentMessageList.length !== 0) {
              that.curMsgNoRepeat(res.data);
            } else {
              let msgList = [];
              let staffObj = {};
              res.data.forEach(item => {
                if (item.from) {
                  if (item.from === "administrator" && item.type === "TIMTextElem") {
                    item.from = that.data.chatInfo.multiTalk.assistantStaffID;
                  }
                  if (item.type == "TIMSoundElem") {
                    item.recordStatus = false; // 播放状态
                    if (Number(item.payload.second) <= 15) {
                      item.recordViewWidth = Number(item.payload.second) * 12 + 100; // 最大宽度不超过370,最小宽度要大于100
                    } else {
                      item.recordViewWidth = (Number(item.payload.second) - 15) * 2 + 280; // 最大宽度不超过370,最小宽度要大于100
                    }
                  }
                  let patientID = that.data.historyInquiryList[that.data.historyInquiryIndex].patientID;
                  let finalPatientID = that.data.historyInquiryList[that.data.historyInquiryIndex].finalPatientID;
                  // 合并患者转换ID
                  if (item.from === patientID) {
                    item.from = finalPatientID;
                  }
                  // 查询医生医助信息（切换医生医助的情况）
                  if (item.from !== "administrator" && item.from !== patientID && item.from !== finalPatientID) {
                    staffObj[item.from] = "1";
                  }
                  msgList.push(item);
                }
              })
              let staffList = Object.keys(staffObj);
              if (staffList.length !== 0) {
                this.getDoctorInfoByStaffList(staffList);
              }
              that.setData({
                currentMessageList: [...msgList, ...that.data.currentMessageList],
                historyInquiryIndex: that.data.historyInquiryIndex + 1
              });
              console.log(that.data.currentType)
              if (that.data.currentType == '2') {
                that.setData({
                  historyInquiryList: [],
                  currentMessageList: [],
                  currentChatID: 'p-' + that.data.inquiryInfo.keyID,
                  count: 0
                });
                that.initPrivateMsgList('p-' + that.data.inquiryInfo.keyID)
              }
              that.setMessageRead()
            }
          }
        }
        wx.stopPullDownRefresh();
      }).catch(err => {
        console.log(err);
        wx.stopPullDownRefresh();
      });
    } else {
      wx.showToast({
        title: '没有更多了~',
        icon: "none",
        duration: "2000"
      });
      wx.stopPullDownRefresh();
    }
  },
  curMsgNoRepeat(data) {
    let that = this;
    let msgList = [];
    let staffObj = {};
    // 从mongo中获取当前问诊的历史记录，并去重
    let curMsgObj = {};
    that.data.currentMessageList.forEach(curMsgItem => {
      let curMsgRandom = curMsgItem.random;
      curMsgObj[curMsgRandom] = "1";
    });
    // 去重mongo 和 tencent IM 消息
    data.forEach(mongoMsgItem => {
      let mongoMsgRandom = mongoMsgItem.random;
      if (!curMsgObj[mongoMsgRandom]) {
        if (mongoMsgItem.from) {
          if (
            mongoMsgItem.from === "administrator" &&
            mongoMsgItem.type === "TIMTextElem"
          ) {
            mongoMsgItem.from = that.data.talkInfo.multiTalkInfo.assistantStaffID;
          }

          let patientID = that.data.historyInquiryList[that.data.historyInquiryIndex].patientID;
          let finalPatientID = that.data.historyInquiryList[that.data.historyInquiryIndex].finalPatientID;
          // 合并患者转换ID
          if (mongoMsgItem.from === patientID) {
            mongoMsgItem.from = finalPatientID;
          }
          // 查询医生医助信息（切换医生医助的情况）
          if (mongoMsgItem.from !== "administrator" && mongoMsgItem.from !== patientID && mongoMsgItem.from !== finalPatientID) {
            staffObj[mongoMsgItem.from] = "1";
          }
          msgList.push(mongoMsgItem);
        }
      }
    });
    let staffList = Object.keys(staffObj);
    if (staffList.length !== 0) {
      this.getDoctorInfoByStaffList(staffList);
    }
    that.setData({
      currentMessageList: [...msgList, ...that.data.currentMessageList],
      historyInquiryIndex: that.data.historyInquiryIndex + 1
    });
    // 如果没有获取到不同的记录，就获取下一次记录                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                
    if (msgList.length === 0) {
      that.dealHistoryMsg();
    }
  },
  getDoctorInfoByStaffList(staffList) {
    let that = this;
    let paramList = [];
    staffList.forEach(staffID => {
      if (!that.data.multiTalkMemberInfo[staffID]) {
        paramList.push(staffID);
      }
    })
    if (paramList.length === 0) return;
    let params = {
      orgID: this.data.chatInfo.tmcPatient.orgID,
      staffIDs: paramList
    }
    HTTP.getDoctorInfoByStaffIDs(params).then(res => {
      if (res.code == 0 && res.data) {
        if (res && res.data && res.data.length !== 0) {
          res.data.forEach(item => {
            let keyID = item.keyID;
            if (!that.data.multiTalkMemberInfo[keyID]) {
              let memberInfo = that.data.multiTalkMemberInfo;
              memberInfo[keyID] = item;
              that.setData({
                multiTalkMemberInfo: memberInfo
              })
            }
          })
        }
      }
    })
  }

  /**模拟跳转到素材 */
  // simulationToMatFun: function() {
  //   let materialData = {
  //     materialType: 0,
  //     title: "图文",
  //     descripm: "描述",
  //     url: "https://apph5.100cbc.com/doctor/agreementRegister.html", // 医生注册协议地址
  //     logoUrl: "https://com-shuibei-peach-hospital-cs.100cbc.com/res/19122116554357936820511001/20011909031475771110201210.jpg" // 唐老鸭封面图片
  //   };
  //   wx.navigateTo({
  //     url: "/pages/online-inquiry/inquiry/videoPlay/videoPlay?materialData=" + JSON.stringify(materialData) // 传输对象、数组时，需要转换为字符窜
  //   });
  // }
})