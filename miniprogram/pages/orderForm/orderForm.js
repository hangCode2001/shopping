// pages/orderForm/orderForm.js
const app = getApp()
const db = wx.cloud.database()
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    
  },

  /**
   * 组件的初始数据
   */
  data: {
    order:{},
    mapType : ["待付款","待发货","已发货","交易成功"],
    mapTip : ["请联系客服付款","请联系客服发货","请注意收货",""],
  },

  /**
   * 组件的方法列表
   */
  methods: {
    onLoad(option){
      this.fetchData(option.id)
    },
    async clickOrder(){
      // 获取调购买所需要调所有参数
      const res = await wx.cloud.callFunction({
        name:"callpay",
        data:{
          order:this.data.order,
          outTradeNo:this.data.order._id,
          nonceStr:this.data.order._id,
          openid:app.globalData.user._openid
        }
      })
      const payment = res.result.payment
      const res2 = await wx.requestPayment({
        ...payment
      }).catch(err=>{
        console.log("支付失败",err);
      })
      if(res2?.errMsg==="requestPayment:ok"){
        await db.collection("order").doc(this.data.order._id).update({
          data:{
            type:1
          }
        })
      }
      else{
        console.log("支付失败");
      }
      this.fetchData(this.data.order._id)
    },
    // 获取数据
    async fetchData(id){
      wx.showLoading({
        title: '',
      })
      console.log(id);
      let res = await db.collection("order").doc(id).get()
      await this.setData({
        order:res.data
      })
      console.log("订单",res);

      wx.hideLoading()
    },
  }
})
