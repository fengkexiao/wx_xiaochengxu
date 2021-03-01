const app = getApp();
const HTTP = require('./../../utils/http-util');
Page({

  /**
   * 页面的初始数据
   */
  data: {
    formType: [],
    formTypeIndex: null,
    frequency:[],
    frequencyIndex: null,
    approach: [],
    approachIndex: null,
    drugInfo: {},
    drugList: [],
    type: "",
    pagesLsit: []
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let drugList = wx.getStorageSync('drugList')
    if(drugList) {
      this.setData({
        drugList: JSON.parse(drugList)
      })
    }
    if(options.drugInfo) {
      this.setData({
        drugInfo: JSON.parse(options.drugInfo)
      })
    }
    this.setData({
      type: options.type
    })
    let index = options.index
    if(index) {
      this.setData({
        drugInfo: this.data.drugList[index]
      })
    }
    this.getDictionary({
      systemCode: "MEDICAL",
      groupCode: "D_MEDICAL_MEDICINE_UNIT",
      parentDictCode: ""
    }, 0)
    this.getDictionary({
      systemCode: "MEDICAL",
      groupCode: "D_MEDICAL_TREAT_FREQUENCY",
      parentDictCode: ""
    }, 1)
    this.getDictionary({
      systemCode: "MEDICAL",
      groupCode: "D_MEDICAL_TREAT_ROUTE",
      parentDictCode: ""
    }, 2)
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    let pages = getCurrentPages()
    this.setData({
      pagesLsit: pages
    })
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

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

  },
  getDictionary(parmams, type) {
    wx.showLoading({
      title: '加载中...'
    });
    HTTP.getDictionary(parmams).then(res => {
      wx.hideLoading();
      if (res.code === 0) {
        if(type == 0) {
          let arr = []
          res.data.forEach(ele => {
            arr.push(ele.dictName)
          })
          this.setData({
            formType: arr
          })
          let state = true
          this.data.formType.forEach((ele,index) => {
            if(ele === this.data.drugInfo.formType) {
              state = false
              this.setData({
                formTypeIndex: index
              })
            }
          })
          if(state) {
            this.setData({
              ['drugInfo.formType']: ''
            })
          }
        }else if(type === 1) {
          let arr = []
          res.data.forEach(ele => {
            arr.push(ele.dictName)
          })
          this.setData({
            frequency: arr
          })
          let state = true
          this.data.frequency.forEach((ele,index) => {
            if(ele === this.data.drugInfo.takeFrequence) {
              state = false
              this.setData({
                frequencyIndex: index
              })
            }
          })
          if(state) {
            this.setData({
              ['drugInfo.takeFrequence']: ''
            })
          }
        }else if(type === 2) {
          let arr = []
          res.data.forEach(ele => {
            arr.push(ele.dictName)
          })
          this.setData({
            approach: arr
          })
          let state = true
          this.data.approach.forEach((ele,index) => {
            if(ele === this.data.drugInfo.takeDirection) {
              state = false
              this.setData({
                approachIndex: index
              })
            }
          })
          if(state) {
            this.setData({
              ['drugInfo.takeDirection']: ''
            })
          }
        }
      }
    })
  },
   // 切换用药单位
   bindtformTypeChange: function(e) {
    this.setData({
      formTypeIndex: e.detail.value
    })
    this.setData({
      ['drugInfo.formType']: this.data.formType[ this.data.formTypeIndex]
    })
  },
  // 切换给药频率
  bindtFrequencyChange: function(e) {
    this.setData({
      frequencyIndex: e.detail.value
    })
    this.setData({
      ['drugInfo.takeFrequence']: this.data.frequency[ this.data.frequencyIndex]
    })
  },
  // 切换给药途径
  bindtApproachChange: function(e) {
    this.setData({
      approachIndex: e.detail.value
    })
    this.setData({
      ['drugInfo.takeDirection']: this.data.approach[ this.data.approachIndex]
    })
  },
  // 单次用药
  takeDoseInput(e) {
    this.setData({
      ['drugInfo.takeDose']: e.detail.value
    })
  },  
  // 用药天数
  medicationDaysInput(e) {
    this.setData({
      ['drugInfo.medicationDays']: e.detail.value
    })
  },  
  // 单次用药
  medicineAmountInput(e) {
    this.setData({
      ['drugInfo.medicineAmount']: e.detail.value
    })
  },  
  // 添加药品后调转
  addMedicine: function() {
    if(this.data.drugInfo.takeDose == '') {
      wx.showToast({
        title: '请输入单次用量',
        icon: 'none',
        duration: 1500
      })
      return false;
    }
    if(this.data.drugInfo.formType == '') {
      wx.showToast({
        title: '请选择用药单位',
        icon: 'none',
        duration: 1500
      })
      return false;
    }
    if(this.data.drugInfo.takeFrequence == '') {
      wx.showToast({
        title: '请选择给药频率',
        icon: 'none',
        duration: 1500
      })
      return false
    }
    if(this.data.drugInfo.takeDirection == '') {
      wx.showToast({
        title: '请选择给药途径',
        icon: 'none',
        duration: 1500
      })
      return false;
    }
    if(this.data.drugInfo.medicationDays == '') {
      wx.showToast({
        title: '请输入用药天数',
        icon: 'none',
        duration: 1500
      })
      return false;
    }
    if(this.data.drugInfo.medicineAmount == '') {
      wx.showToast({
        title: '请输入开药量',
        icon: 'none',
        duration: 1500
      })
      return false;
    }
    if(this.data.type == 'add') {
      
      this.data.drugList.push(this.data.drugInfo)
      wx.setStorageSync('drugList', JSON.stringify(this.data.drugList))
    }else if(this.data.type == 'edit'){
      this.data.drugList.forEach((ele,index) => {
        if(index == this.data.index) {
          this.setData({
            ['drugList['+ index +']']: this.data.drugInfo
          })
        }
      })
      wx.setStorageSync('drugList', JSON.stringify(this.data.drugList))
    }
    console.log(this.data.pagesLsit)
    this.data.pagesLsit.forEach((ele,index) => {
      if(ele.is === "pages/rootPage/rootPage") {
        wx.navigateBack({
          delta: this.data.pagesLsit.length - (index + 1)
        })
      }
    })
  }
})