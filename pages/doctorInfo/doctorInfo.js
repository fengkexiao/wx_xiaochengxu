const app = getApp();
const HTTP = require('./../../utils/http-util');
Page({

  /**
   * 页面的初始数据
   */
  data: {
    doctorInfo: {},
    diseaseName: "",
    pageIndex: 1,
    commonList: [],
    judge: 0,
    info: {},
    loading: true,
    showBtn: false,
    pageList: []
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.setData({
      info: JSON.parse(options.info)
    })
    if (this.data.info.staffID !== app.globalData.userInfo.assistantStaffID) {
      this.setData({
        showBtn: true
      })
    }
    let pages = getCurrentPages()
    this.setData({
      pageList: pages
    })
    this.getDoctorInfoByStaffID()
    this.getDoctorDiseaseByDoctorID()
    this.getDoctorCommentList()
  },
  /**
   * 查询医生基本信息
   */
  getDoctorInfoByStaffID() {
    let params = {
      staffID: this.data.info.staffID
    }
    wx.showLoading({
      title: '加载中...'
    });
    HTTP.getDoctorInfoByStaffID(params).then(res => {
      wx.hideLoading();
      if (res.code === 0) {
        this.setData({
          doctorInfo: res.data
        })
        setTimeout(() => {
          this.setData({
            loading: false
          })
        }, 50)
      }
    }).catch(() => {
      wx.hideLoading();
    });
  },
  /**
   * 查询医生擅长
   */
  getDoctorDiseaseByDoctorID() {
    let params = {
      doctorID: this.data.info.staffID
    }
    HTTP.getDoctorDiseaseByDoctorID(params).then(res => {
      if (res.code === 0) {
        let name = ""
        res.data.map(ele => {
          name = name + (name ? "、" : "") + ele.diseaseName
        })
        this.setData({
          diseaseName: name
        })
      }
    })
  },
  /**
   * 加载更多
   */
  handleLower: function () {
    if (this.data.judge == 0) {
      this.setData({
        pageIndex: this.data.pageIndex + 1,
      })
      this.getDoctorCommentList();
    }
  },
  /**
   * 查询评价列表
   */
  getDoctorCommentList() {
    let params = {
      orgID: app.globalData.userInfo.orgID,
      doctorStaffID: this.data.info.staffID,
      pageSize: 15,
      pageIndex: this.data.pageIndex
    }
    wx.showLoading({
      title: '加载中',
      icon: 'loading',
    });
    HTTP.getOrderCommentList(params).then(res => {
      if (res.code === 0) {
        let list = res.data.datas || []
        if (res.data.totalPage <= this.data.pageIndex) {
          this.setData({
            commonList: this.data.commonList.concat(list),
            judge: 1
          })
        } else {
          this.setData({
            commonList: this.data.commonList.concat(list)
          })
        }
        wx.hideLoading();
      }
    })
  },
  /**
   * 私聊
   * @param {*} event 
   */
  handleGoChat(event) {
    // wx.navigateTo({
    //   url: `./../online-inquiry/inquiry/chat/chat?currentType=2`,
    // })
    // wx.navigateTo({
    //   url: './../online-inquiry/inquiry/chat/chatc'
    // })
    this.data.pageList.forEach((ele, index) => {
      if (ele.is === "pages/online-inquiry/inquiry/chat/chat") {
        let prevPage = this.data.pageList[this.data.pageList.length - (index + 2)];
        prevPage.setData({ // 将我们想要传递的参数在这里直接setData。上个页面就会执行这里的操作。
          currentType: '2'
        })
        wx.navigateBack({
          delta: this.data.pageList.length - (index + 1)
        })
      }
    })

    // wx.navigateBack({
    //   delta: list.length - (index + 1)
    // })

    // let pages = getCurrentPages() //获取当前的页面栈
    // //1. 跨页面赋值

    // let prevPage = pages[pages.length - 3]; //上一页面
    // prevPage.setData({
    //   //直接给上一页面赋值
    // });
    // //2.页面跳转后自动刷新
    // //举例
    // wx.switchTab({
    //   url: './../online-inquiry/inquiry/chat/chat',
    //   success: function (e) {
    //     var page = getCurrentPages().pop(); //当前页面
    //     if (page == undefined || page == null) return;
    //     page.onLoad(); //或者其它操作
    //   }
    // })
    //3.获取当前页面相关信息

    //当前页面为页面栈的最后一个元素
    // let prevPage = pages[pages.length - 1]; //当前页面
    // or
    // pop() 方法用于删除并返回数 组的最后一个元素
    //let prevPage = pages.pop(); //当前页面
  }
})