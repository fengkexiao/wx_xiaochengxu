const app = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    receiverName: '',
    receiverPhone: '',
    patientInfo: {},
    pageList: [],
    goChat: "",
    chatItem: {}
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let data = JSON.parse(options.patientInfo)
    if (data.birthYear !== 0) {
      data.age = this.getAnalysisIdCard(data.birthYear, 3)
    } else {
      data.age = ''
    }
    console.log(this.data)
    let pages = getCurrentPages()
    this.setData({
      patientInfo: data,
      pageList: pages,
      goChat: options.goChat || '',
      
    })
    if(options.goChat){
      this.setData({
        chatItem: JSON.parse(options.item) || {}
      })
    }
  },

  getAnalysisIdCard(idNumber, type) {
    if (type === 3) {
      // 获取年龄
      let myDate = new Date();
      let age = myDate.getFullYear() - idNumber;
      return age;
    }
  },
  // 查看患者信息
  patientInfoClick(e) {
    wx.navigateTo({
      url: `../patientInfo/patientInfo?patient=${JSON.stringify(e.currentTarget.dataset.info)}`,
    })
  },
  // 查看订单记录
  orderClick(e) {
    wx.navigateTo({
      url: `../historyOrders/historyOrders?patientID=${e.currentTarget.dataset.info.keyID}`,
    })
  },
  handleGoChat() {
    if (this.data.goChat === '1') {
      let item = this.data.chatItem
      app.globalData.chatKeyId = item.multiTalk.imID;
      app.globalData.doctorInfo = item.doctor;
      wx.setStorageSync('chatInfo', JSON.stringify(item))
      wx.setStorageSync('doctorInfo', JSON.stringify(item.doctor))
      wx.navigateTo({
        url: '/pages/online-inquiry/inquiry/chat/chat',
      })
    } else {
      this.data.pageList.forEach((ele, index) => {
        if (ele.is === "pages/online-inquiry/inquiry/chat/chat") {
          let prevPage = this.data.pageList[this.data.pageList.length - (index + 2)];
          prevPage.setData({ // 将我们想要传递的参数在这里直接setData。上个页面就会执行这里的操作。
            currentType: '1'
          })
          wx.navigateBack({
            delta: this.data.pageList.length - (index + 1)
          })
        }
      })
    }




  }
})