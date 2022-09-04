文档： https://www.youbaobao.xyz/admin-docs/

## express学习
```js
const express = require('express')

const app = express()
function myLogger(req,res,next){
     console.log('myLogger')
     next() //调用next访问下一个中间件
 }
app.use(myLogger)  //中间件要在路由请求   之前
//后置中间件捕获异常
function errorHanlder(err,req,res,next){
     console.log('errorHanlder')
     res.status(500).json({
        error:-1,
        msg:err.toString()
     })
}
app.get('/',(req,res)=>{
     res.send('hello node')
})
app.use(errorHanlder)  //捕获异常
const server = app.listen(3000,()=>{
     const {port} = server.address()
     console.log(`server at: http://localhost:${port}`)
})
```

## epub电子书原理
- epub是电子书格式，本质是一个zip压缩包


## post参数解析
const bodyParser = require('body-parser')
const app = express()
app.use(bodyParser.urlencoded({extended:true}))  //解析body参数 a=1&b=1
app.use(bodyParser.json())  //解析body参数  {a:1,b:1}

## 设置跨域
npm i cors 
const cors = require('cors')
const app = express()
app.use(cors())

## mysql使用
npm i mysql

docker 启动myql
docker run -d -p 3306:3306  -e MYSQL_ROOT_PASSWORD=123456 --name mysql mysql

## navicat无法连接mysql服务

1、进入docker容器：docker exec -it mysql bash 
2、进入MySQL客户端： mysql -u root -p 
3、修改密码：ALTER USER 'root'@'%' IDENTIFIED BY '123456'; 
4、刷新权限：flush privileges;

如果是mysql8 要修改密码认证方式
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '123456';
ALTER USER 'root'@'%' IDENTIFIED WITH mysql_native_password BY '123456';
查看：select host,user,plugin,authentication_string from mysql.user;

## node连接mysql
 Client does not support authentication protocol requested by server; consider upgrading MySQL client

进入mysql容器

修改密码认证方式
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '123456';
ALTER USER 'root'@'%' IDENTIFIED WITH mysql_native_password BY '123456';
查看：select host,user,plugin,authentication_string from mysql.user;


## exprese-validator  boom

exprese-validator 表单校验
boom 生成错误信息

npm i -S express-validator
```js

const { body, validationResult } = require('express-validator')
const boom = require('boom')

router.post(
  '/login',
  [
    body('username').isString().withMessage('username类型不正确'),
    body('password').isString().withMessage('password类型不正确')
  ],
  function(req, res, next) {
    const err = validationResult(req)
    if (!err.isEmpty()) {
      const [{ msg }] = err.errors
      next(boom.badRequest(msg))
    } else {
      const username = req.body.username
      const password = md5(`${req.body.password}${PWD_SALT}`)

      login(username, password).then(user => {
        if (!user || user.length === 0) {
          new Result('登录失败').fail(res)
        } else {
          new Result('登录成功').success(res)
        }
      })
    }
  })
```

express-validator 使用技巧：

- 在 router.post 方法中使用 body 方法判断参数类型，并指定出错时的提示信息
- 使用 const err = validationResult(req) 获取错误信息，err.errors 是一个数组，包含所有错误信息，如果 err.errors 为空则表示校验成功，没有参数错误
- 如果发现错误我们可以使用 next(boom.badRequest(msg)) 抛出异常，交给我们自定义的异常处理方法进行处理


## jwt

### 生成 JWT Token

npm i -S jsonwebtoken

使用

```js
const jwt = require('jsonwebtoken')
const { PRIVATE_KEY, JWT_EXPIRED } = require('../utils/constant')

login(username, password).then(user => {
    if (!user || user.length === 0) {
      new Result('登录失败').fail(res)
    } else {
      const token = jwt.sign(
        { username },
        PRIVATE_KEY,
        { expiresIn: JWT_EXPIRED }
      )
      new Result({ token }, '登录成功').success(res)
    }
})
```


## epub解析

https://github.com/julien-c/epub/blob/master/epub.js