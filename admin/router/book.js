const express = require('express')
const Result = require('../models/Result')
const multer = require('multer')
const Book = require('../models/Book')
const {UPLOAD_PATH} = require('../utils/constant')
const router = express.Router()
const boom = require('boom')
const {decoded} = require('../utils')
const {insertBook,getBook,updateBook,getCategory,listBook,deleteBook} = require('../services/book')
router.post('/upload',multer({dest: UPLOAD_PATH}).single('file'),function(req,res,next){
    if(!req.file){
         new Result('上传电子书失败').fail(res)
    }else{
        const book = new Book(req.file)
        book.parse().then(book=>{
            new Result(book.toJson(),'上传成功').success(res)
        }).catch(e=>{
            next(boom.badImplementation(e))
            book.reset()
        })
    
    }
})
router.post('/create',function(req,res,next){
     const decode = decoded(req) 
     const book = new Book(null,req.body)
     if(decode && decode.username){
        book.username = decode.username
     }
     insertBook(book).then(()=>{
          new Result('添加成功').success(res)
     }).catch(e=>{
        next(boom.badImplementation(e))
     })
})
router.post('/update',function(req,res,next){
    const decode = decoded(req) 
    const book = new Book(null,req.body)
    if(decode && decode.username){
       book.username = decode.username
    }
    updateBook(book).then(()=>{
         new Result('更新成功').success(res)
    }).catch(e=>{
       next(boom.badImplementation(e))
    })
})
router.get('/get',function(req,res,next){
    const fileName = req.query.fileName
    if(!fileName){
        next(boom.badRequest(new Error('参数fileName不能为空')))
    }else{
        getBook(fileName).then((book)=>{
              new Result(book,'获取成功').success(res)
        }).catch(e=>{
            next(boom.badImplementation(e))
        })
    }
    
})
router.get('/category',function(req,res,next){
    getCategory().then((category)=>{
        new Result(category,'获取分类成功').success(res)
  }).catch(e=>{
      next(boom.badImplementation(e))
  })
    
})
router.get('/list',function(req,res,next){
    listBook(req.query).then(({list,count,page,pageSize})=>{
        new Result({list,count,page,pageSize},'获取列表成功').success(res)
  }).catch(e=>{
      next(boom.badImplementation(e))
  })
    
})
router.get('/delete',function(req,res,next){
    deleteBook(req.query.fileName).then(()=>{
        new Result('删除列表成功').success(res)
  }).catch(e=>{
      next(boom.badImplementation(e))
  })
    
})
module.exports = router