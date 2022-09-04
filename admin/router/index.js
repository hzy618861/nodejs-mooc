const express = require('express')
const boom = require('boom')
const userRouter = require('./user')
const bookRouter = require('./book')
const Result = require('../models/Result')
const {
    CODE_ERROR
} = require('../utils/constant')
const jwtAuth = require('./jwt')
//注册路由
const router = express.Router()
router.use(jwtAuth)
router.get('/',function(req,res){
     res.send('hello nodejs服务')
})
router.use('/user',userRouter)
router.use('/book',bookRouter)
//处理404请求
router.use((req,res,next)=>{
     next(boom.notFound('接口不存在'))
})
//自定义路由异常处理中间件
router.use((err,req,res,next)=>{
     if(err.name && err.name=='UnauthorizedError'){
           //token过期或者没有token
          const {status = 401,message} = err
          new Result(null,'token失效',{
               error:status,
               errMsg:message
          }).tokenError(res.status(status))
     }else{
          const msg = (err && err.message) || '系统错误'
          const statusCode = (err.output && err.output.statusCode) || 500
          const errorMsg = (err.output && err.output.payload && err.output.payload.error) || err.message
          new Result(null,msg,{
               error:statusCode,
               errMsg:errorMsg
          }).fail(res.status(statusCode))
     }
  
})
module.exports = router