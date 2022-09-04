const express = require('express')
const router = require('./router')
const bodyParser = require('body-parser')
const cors = require('cors')
const app = express()
app.use(cors())
app.use(bodyParser.urlencoded({extended:true}))  //解析body参数 a=1&b=1
app.use(bodyParser.json({limit:'2100000kb'}))  //解析body参数  {a:1,b:1}
app.use('/',router)
const server = app.listen(3000,()=>{
     const {port} = server.address()
     console.log(`server at: http://localhost:${port}`)
})