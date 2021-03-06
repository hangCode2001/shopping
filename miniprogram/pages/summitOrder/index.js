// pages/order/order.js
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
    ways:['门店就餐','送餐上门'],
    waysIndex:0,
    goodsList:[],
    total_price:0,
    note:'',
    delivery_address:{},
    phone:''
  },

  /**
   * 组件的方法列表
   */
  methods: {
    
    onLoad(option){
        let bags = option.bags.split(',')
        console.log('option',option);
        let res = bags.map(v=>app.globalData.user.bags[v])
        let price = 0
        res.forEach(v=>{
            price+=v.price*v.count
        })
        this.setData({
            goodsList:res,
            total_price:price,
            waysIndex:res[0].ways_index,
            delivery_address:app.globalData.user.delivery_address
        })
    },
    onShow(){
        this.setData({
            note:app.globalData.note,
            delivery_address:app.globalData.user.delivery_address
        })
    },
    navToNote(){
        wx.navigateTo({
          url: "../note/index",
        })
    },
    async clickOrder(){
      wx.showLoading({
        title: '',
      })
      let order={
        address:app.globalData.user.delivery_address,
        goods:this.data.goodsList,
        type:0,
        ways_index:this.data.waysIndex,
        total_price:this.data.total_price,
        note:this.data.note,
        order_time:new Date().format("yyyy-MM-dd hh:mm:ss")
      }
      app.globalData.user.bags=[]
      if(this.data.waysIndex==0)
      {
        order.phone=this.data.phone
        await wx.requestSubscribeMessage({
            tmplIds:['soSYRWp6na5sLqtUf9hKiaM_Re_kCDD_m8VDU_i7cCI','0sFxicuSgMthqpp59RSYUigE3wEkJ_CUyCVbRmiDRxI']
        })
      }
      else {
        await wx.requestSubscribeMessage({
            tmplIds:['Os1nnL5EGJulquw3k3OcD1x3FX0kf86FbqzNcuHuGFE']
        })
      }

      await wx.cloud.callFunction({
          name:"updateUser",
          data: app.globalData.user
          
      })
      let addRes=await wx.cloud.callFunction({
          name:"addOrder",
          data:order
      })
      let newOrder=addRes.result
      console.log("addOrder",newOrder)
      wx.hideLoading()
      // 获取调购买所需要调所有参数
      console.log('order',order);
      const res = await wx.cloud.callFunction({
        name:"callpay",
        data:{
          order,
          outTradeNo:newOrder._id,
          nonceStr:newOrder._id,
          openid:app.globalData.user._openid
        }
      })
      const payment = res.result.payment
      console.log('payment',payment);
      const res2 = await wx.requestPayment({
        ...payment
      }).catch(err=>{
        console.log("支付失败",err);
      })
      if(res2?.errMsg==="requestPayment:ok"){
          let data = {
            type:1,
            id:newOrder._id,
            pay_time:new Date().format("yyyy-MM-dd hh:mm:ss")
          }
          if(this.data.waysIndex==0){
            let catchRes= await wx.cloud.callFunction({
                name:'getCatchNum'
            })
            
            let catch_num = catchRes.result
            data.catch_num=catch_num
            console.log("catch_num",catch_num);
          }
          await wx.cloud.callFunction({
            name:"changeOrder",
            data,
        })
      }
      else{
        console.log("支付失败");
      }
      wx.navigateTo({
        url: `../orderDetail/index?id=${newOrder._id}`,
      })
    },
    openLocation(){
        wx.chooseLocation().then(res=>{
            console.log("位置结果",res);
        })
    },
    navToAdress(){
        wx.navigateTo({
          url: '../address/address',
        })
    },
    async getPhoneNumber(e){
        let res=await wx.cloud.callFunction({
            name:'getPhone',
            data:{
                code:e.detail.code
            }
        })
        this.setData({
            phone:res.result
        })
    },
    changePhone(e){
        console.log(e.detail.value);
        this.setData({
            phone:e.detail.value
        })
    }
  }
})
