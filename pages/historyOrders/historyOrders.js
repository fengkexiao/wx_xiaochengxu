const app = getApp();
const HTTP = require('./../../utils/http-util');
Page({
  /**
   * 页面的初始数据
   */
  data: {
    statusBarHeight: app.globalData.systemInfo.statusBarHeight,
    navBarHeight: app.globalData.navBarHeight,
    headerList: [{
        name: '全部',
        check: true,
        status: ''
      },
      {
        name: '待支付',
        check: false,
        status: '0'
      },
      {
        name: '待发货',
        check: false,
        status: '1'
      }, {
        name: '已发货',
        check: false,
        status: '2'
      },
      {
        name: '已完成',
        check: false,
        status: '3'
      }
    ],
    orderList: [],
    pageIndex: 1,
    judge: 0,
    orderStatusID: '',
    deliveryStatusID: '',
    patientID: '',
    portState: true
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    if(options.patientID) {
      this.setData({
        patientID: options.patientID
      })
    }
    this.getOrdersList()
  },
  /**
   * 加载更多
   */
  handleLower: function () {
    if (this.data.judge == 0 && this.data.portState) {
      this.setData({
        pageIndex: this.data.pageIndex + 1,
      })
      this.getOrdersList();
    }
  },
  /**
   * 查询订单列表
   */
  getOrdersList() {
    let params = {
      orgID: app.globalData.userInfo.orgID,
      pageSize: 15,
      pageIndex: this.data.pageIndex,
      deliveryStatusID: this.data.deliveryStatusID,
      orderStatusID: this.data.orderStatusID,
      assistantStaffID: app.globalData.userInfo.assistantStaffID,
      patientID: this.data.patientID
    }

    wx.showLoading({
      title: '加载中',
      icon: 'loading',
    });
    this.setData({
      portState: false
    })
    HTTP.getRecordListByPage(params).then(res => {
      if (res.code === 0) {
        let list = res.data.datas || []
        this.setData({
          portState: true
        })
        list.forEach(ele => {
          ele.totalPrice = 0
          ele.medicine.forEach(eles => {
            ele.totalPrice = ele.totalPrice + (eles.unitPrice / 100 * eles.medicineAmount)
          })
        })
        if (res.data.totalPage <= this.data.pageIndex) {
          this.setData({
            orderList: this.data.orderList.concat(list),
            judge: 1
          })
        } else {
          this.setData({
            orderList: this.data.orderList.concat(list),
            judge: 0
          })
        }
        wx.hideLoading();
      }
    }).catch(() => {
      wx.hideLoading();
      this.setData({
        portState: true
      })
    })
  },
  /**
   * 点击不同类型
   * @param {*} event 
   */
  handleClickType: function (event) {
    let ckItem = event.currentTarget.dataset.item
    this.data.headerList.map(item => {
      if (item.name === ckItem.name) {
        let orderStatusID = ''
        let deliveryStatusID = ''
        switch (item.status) {
          case '0':
            orderStatusID = 0
            break;
          case '1':
            deliveryStatusID = 1
            break;
          case '2':
            deliveryStatusID = 2
            break;
          case '3':
            deliveryStatusID = 3
            break;
        }
        this.setData({
          orderStatusID,
          deliveryStatusID
        })
        item.check = true
        this.setData({
          orderList: [],
          pageIndex:1,
          judge: 0
        })
        this.getOrdersList()
      } else {
        item.check = false
      }
    })

    this.setData({
      headerList: this.data.headerList
    })
  },
  // 查看处方
  checkRecipe(e) {
    console.log(e)
    let data = e.target.dataset.info
    if(data) {
      let obj = {
        orgID: data.orgID,
        rpID: data.rpID
      }
      wx.navigateTo({
        url: `../prescriptionNotes/prescriptionNotes?recipe=${JSON.stringify(obj)}`,
      })
    }
  }
})