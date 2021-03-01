const app = getApp();
const HTTP = require('../../utils/http-util');
Page({

  /**
   * 页面的初始数据
   */
  data: {
    search: "",
    active: 0,
    userInfoList: [],
    isFocus: false,
    inputValue: "",
    pageIndex: 1,
    judge: 0,
    portState: true,
    inputfocus:false,
    statusBarHeight: app.globalData.systemInfo.statusBarHeight,
    navBarHeight: app.globalData.navBarHeight
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    setTimeout(()=>{
      this.setData({
        inputfocus:true
      })
    },10)
    
  },
  /**
   *  下拉查询更多
   */
  handleLower() {
    if (!this.data.portState) {
      return false;
    }
    this.setData({
      pageIndex: this.data.pageIndex + 1,
    })
    if (this.data.judge == 0) {
      this.queryMultiTalkPage(this.data.inputValue)
    }
  },
  /**
   * 患者详情
   * @param {*} event 
   */
  handleItem(event) {
    let item = event.currentTarget.dataset.item
    let keyID = item.tmcPatient.keyID
    item.patient.keyID = keyID
    item.tmcPatient.faceImage=item.patient.faceImage
    wx.navigateTo({
        url:`/pages/personInfo/personInfo?patientInfo=${JSON.stringify(item.tmcPatient)}&goChat=1&item=${JSON.stringify(item)}`
    });
  },
  
  /**
   * 搜索
   */
  queryMultiTalkPage(str) {
    this.setData({
      portState: false
    })
    wx.showLoading({
      title: '加载中...'
    });
    let params = {
      orgID: app.globalData.userInfo.orgID,
      staffID: app.globalData.userInfo.assistantStaffID,
      type: "1",
      queryStr: str,
      pageSize: 15,
      pageIndex: this.data.pageIndex
    }
    HTTP.queryMultiTalkPage(params).then(res => {
      wx.hideLoading();
      this.setData({
        portState: true
      })
      if (res.code === 0) {
        let list = res.data.datas || []
        if (res.data.totalPage <= this.data.pageIndex) {
          this.setData({
            userInfoList: this.data.userInfoList.concat(list),
            judge: 1
          })
        } else {
          this.setData({
            userInfoList: this.data.userInfoList.concat(list),
            judge: 0
          })
        }
      }else{
        this.setData({
          userInfoList: [],
          judge: 0
        })
      }
    }).catch((error) => {
      wx.hideLoading();
      this.setData({
        portState: true
      })
    })
  },

  /**
   * 搜索框获取焦点
   */
  handleFocusInput: function () {
    this.setData({
      isFocus: true,
      userInfoList: []
    })
  },
  /**
   *  取消焦点
   */
  cancelFocus: function () {
    this.setData({
      isFocus: false,
      inputValue: ""
    })
  },
  /**
   * 搜索输入框搜索
   * @param {*} e 
   */
  handleConfirm(e) {
    this.setData({
      inputValue: e.detail.value
    })
    this.setData({
      userInfoList: [],
      judge: 0,
      pageIndex: 1
    })
    if (e.detail.value) {
      this.queryMultiTalkPage(e.detail.value)
    } else {
      this.setData({
        isFocus: false
      })
    }

  },
  /**
   * 格式化时间
   * @param {*} date 
   */
  formatDate(date) {
    let ret;
    const opt = {
      "Y+": date.getFullYear().toString(), // 年
      "m+": (date.getMonth() + 1).toString(), // 月
      "d+": date.getDate().toString(), // 日
      "H+": date.getHours().toString(), // 时
      "M+": date.getMinutes().toString(), // 分
      "S+": date.getSeconds().toString() // 秒
    };
    let fmt = 'YYYY-mm-dd'
    for (let k in opt) {
      ret = new RegExp("(" + k + ")").exec(fmt);
      if (ret) {
        fmt = fmt.replace(ret[1], (ret[1].length == 1) ? (opt[k]) : (opt[k].padStart(ret[1].length, "0")))
      };
    };
    return fmt;
  },
  /**
   * 获取这周的周一
   * @param {*} date 
   */
  getLastDayOfWeek(date) {
    let weekday = date.getDay() || 7; // 获取星期几,getDay()返回值是 0（周日） 到 6（周六） 之间的一个整数。0||7为7，即weekday的值为1-7
    date.setDate(date.getDate() + (7 - weekday)); // 往前算（weekday-1）天，年份、月份会自动变化
    return this.formatDate(date);
  },
  /**
   * 获取明天
   * @param {*} date 
   */
  getTomorrow(date) {
    var day3 = date;
    day3.setTime(day3.getTime() + 24 * 60 * 60 * 1000);
    return day3.getFullYear() + "-" + (day3.getMonth() + 1) + "-" + day3.getDate();
  },
  /**
   * 获取这个月的最后一天
   * @param {*} date 
   */
  getLastDayOfMonth(date) {
    let month = date.getMonth();
    date.setMonth(month + 1); // 设置月份加1
    date.setDate(0); // 设置月份减1
    return this.formatDate(date);
  }
})