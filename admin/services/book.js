const { insert,queryOne,querySql,update,and,andLike} = require('../db')
const Book = require('../models/Book')
const _ = require('lodash')
function exists(book){
     const {title,author,publisher} = book
     const sql = `select * from book where title='${title}' and author='${author}' and publisher='${publisher}'`
     return queryOne(sql)
}
async function removeBook(book){
     if(book){
        book.reset()
        if(book.fileName){
             const removeBookSql = `delete from book where fileName='${book.fileName}'`
             const removeContentsSql = `delete from contents where fileName='${book.fileName}'`
             await querySql(removeBookSql)
             await querySql(removeContentsSql)
        }
     }
}
function insertContents(book){
      const contents = book.getContents()
      if(contents && contents.length>0){
         for(let i=0;i<contents.length;i++){
             const content = contents[i]
             const _content = _.pick(content,[
                'fileName',
                'id',
                'href',
                'order',
                'level',
                'label',
                'pid',
                'navId'
             ])
             console.log(_content)
         }
      }
}
function insertBook(book) {
    return new Promise(async (resolve,reject)=>{
          try{
            console.log('after:',book instanceof Book)
             if(book instanceof Book){
                 const result = await exists(book)
                 if(result){
                     await removeBook(book)
                     reject(new Error('电子书已存在'))
                 }else{
                    await insert(book.toDb(),'book')
                    await insertContents(book)
                    resolve()
                 }
             }else{
                reject(new Error('book对象不合法'))
             }        
          }catch(e){
            reject(e)
          }
    })
}
function getBook(fileName){
     return  new Promise(async (resolve,reject)=>{
         const bookSql = `select * from book where fileName='${fileName}'`
         const contentsSql = `select * from contents where fileName='${fileName}'`
         const book = await queryOne(bookSql)
         const contents = await querySql(contentsSql)
        
         if(book){
            console.log('content: ',contents)
            book.contents = contents
            book.chapterTree = Book.getContentsTree(book)
            resolve(book)
         }else{
             reject(new Error('电子书不存在'))
         }
         
     })
}

function updateBook(book) {
    return new Promise(async (resolve,reject)=>{
          try{
             if(book instanceof Book){
                 const result = await getBook(book.fileName)
                 console.log('asd',result)
                 if(result){
                     const model = book.toDb()
                     if(result.updateType==0){
                        reject(new Error('内置图书不能编辑'))
                     }else{
                        await update(model,'book',`where fileNAme='${book.fileName}'`)
                        resolve()
                     }
                 }
             }else{
                reject(new Error('book对象不合法'))
             }        
          }catch(e){
            reject(e)
          }
    })
}
async function getCategory(){
     const sql = 'select * from category order by category asc'
     const result = await querySql(sql)
     const categoryList = []
     result.forEach(item=>{
        categoryList.push({
            label:item.categoryText,
            value:item.category,
            num:item.num
        })
     })
     return categoryList

}
async function listBook(query){
     const { page = 1, pageSize =10, sort, category,author,title } = query
     let bookSql  = 'select * from book'
     let where = 'where'
     category && (where = and(where,'categoryText',category))
     author && (where = andLike(where,'author',author))
     title && (where = andLike(where,'title',title))
     const offset = (page-1) * pageSize
     if(where !=='where'){
         bookSql = `${bookSql} ${where}`
     }
     if(sort){
         const symbol = sort[0]
         const column = sort.slice(1,sort.length)
         const order = symbol === '+' ?'asc': 'desc'
         bookSql = `${bookSql} order by \`${column}\` ${order}`
     }
     
     let countSql = `select count(*) as count from book`
     if(where!=='where'){
        countSql = `${countSql} ${where}`
     }
     const count = await querySql(countSql)
     bookSql = `${bookSql} limit ${offset},${pageSize}`
     const list = await querySql(bookSql)
     return {list,count:count[0].count,page,pageSize}
}
function deleteBook(fileName){
      return new Promise(async (resolve,reject)=>{
           let book = await getBook(fileName)
           if(book){
             if(+book.updateType===0){
                 reject(new Error('内置电子书不能删除'))
             }else{
                const bookObj = new Book(null,book)
                const sql = `delete from book where fileName='${fileName}'`
                querySql(sql).then(()=>{
                      bookObj.reset()
                      resolve()
                })
             }
           }else{
            reject(new Error('电子书不存在'))
           }
            
      })
}
module.exports = { insertBook,getBook,updateBook,getCategory,listBook,deleteBook }