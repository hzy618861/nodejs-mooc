const express = require('express')
const Result = require('../models/Result')
const {login, findUser} = require('../services/user')
const { md5,decoded } = require('../utils')
const boom = require('boom')
const jwt = require('jsonwebtoken')
const { PRIVATE_KEY, JWT_EXPIRED ,PWD_SALT} = require('../utils/constant')
const {body,validationResult} = require('express-validator')
const router = express.Router()
router.get('/info',function(req,res){
     //解析token，获取用户名
     const decode = decoded(req)
     if(decode && decode.username){
          findUser(decode.username).then(user=>{
               if(user){
                  user.roles = [user.role]
                  new Result(user,'用户信息查询成功').success(res)
               }else{
                  new Result(user,'用户信息查询失败').fail(res)
               }
        })
     }else{
          new Result(user,'用户信息查询失败').fail(res)
     }
 
    
})
router.post('/login',[
     body('username').isString().withMessage('用户名必须为字符'),
     body('password').isNumeric().withMessage('密码必须为数字'),
],function(req,res,next){
     const err = validationResult(req)
     if(!err.isEmpty()){
          const [{msg}] = err.errors
          next(boom.badRequest(msg)) //传递下一个中间件
     }else{
          let {username,password} = req.body 
          password = md5(`${password}${PWD_SALT}`)
          console.log('password:',password)
          login(username,password).then(user=>{
                 if(!user || user.length==0){
                    new Result('登陆失败').fail(res)
                 }else{
                    const [_user] = user
                    const token = jwt.sign({username},PRIVATE_KEY,{expiresIn:JWT_EXPIRED})
                    new Result({token},'登陆成功').success(res)
                 }
          })
     }
})
module.exports = router