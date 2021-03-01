const app = getApp();
const HTTP = require('./../../utils/http-util');

Page({

  /**
   * 页面的初始数据
   */
  data: {
    patient: {},
    patientInfo: {},
    healthInfo: {},
    dicList: [],
    fromList: [],
    loading: true
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.setData({
      patient: JSON.parse(options.patient)
    })
    this.getDictionary({
      systemCode: "TMC",
      groupCode: "D_TMC_PATIENT_RELATION",
      parentDictCode: ""
    }, 0)
    this.getDictionary({
      systemCode: "TMC",
      groupCode: "D_TMC_PATIENT_FROM",
      parentDictCode: ""
    }, 1)
  },
  /**
   * 查询数据字典
   */
  getDictionary(parmams, type) {
    wx.showLoading({
      title: '加载中...'
    });
    HTTP.getDictionary(parmams).then(res => {
      wx.hideLoading();
      if (res.code === 0) {
        if (type === 0) {
          this.setData({
            dicList: res.data
          })
          this.setData({
            loading: false
          })
        } else if (type === 1) {
          this.setData({
            fromList: res.data
          })
          this.getPatientInfo()
          this.getPatientDoc()
        }
      }
    }).catch(() => {
      wx.hideLoading();
    })
  },
  /**
   * 患者信息
   */
  getPatientInfo() {
    wx.showLoading({
      title: '加载中...'
    });
    let params = {
      orgID: app.globalData.userInfo.orgID,
      keyID: this.data.patient.keyID
    }
    HTTP.getPatientById(params).then(res => {
      wx.hideLoading();
      if (res.code === 0) {
        let data = res.data
        if (data) {
          if (data.birthYear !== 0) {
            data.age = this.getAnalysisIdCard(data.birthYear, 3)
          } else {
            data.age = ''
          }
        }
        this.data.dicList.map(item => {
          if (item.code === data.relationCode) {
            data.relationName = item.dictName
          }
        })
        this.data.fromList.map(item=>{
          if (item.code === data.channelCode) {
            data.channelName = item.dictName
          }
        })
        this.setData({
          patientInfo: data
        })
        console.log('123123123')
        console.log(this.data.patientInfo)
      }
    }).catch(() => {
      wx.hideLoading();
    })
  },
  /**
   * 获取患者档案
   * @param {*} keyID 
   */
  getPatientDoc(keyID) {
    wx.showLoading({
      title: '加载中...'
    });
    let params = {
      orgID: app.globalData.userInfo.orgID,
      keyID: this.data.patient.keyID
    }
    HTTP.getPatientDoc(params).then(res => {
      wx.hideLoading();
      if (res.code === 0) {
        let list = res.data || []
        let obj = {}
        list.map(item => {
          obj[item.docItemCode] = item
        })
        this.setData({
          healthInfo: obj
        })
      }
    }).catch(() => {
      wx.hideLoading();
    })
  },
  /**
   * 获取年龄
   * @param {*} idNumber 
   * @param {*} type 
   */
  getAnalysisIdCard(idNumber, type) {
    if (type === 1) {
      // 获取出生日期
      let birth = idNumber.substring(6, 10) + "-" + idNumber.substring(10, 12) + "-" + idNumber.substring(12, 14);
      return birth;
    }
    if (type === 2) {
      // 获取性别
      if (parseInt(idNumber.substr(16, 1)) % 2 === 1) {
        return 1;
      } else {
        return 2;
      }
    }
    if (type === 3) {
      // 获取年龄
      let myDate = new Date();
      let age = myDate.getFullYear() - idNumber;
      return age;
    }
  }
})