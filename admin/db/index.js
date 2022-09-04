const msyql = require('mysql')
const { host, user, password, database } = require('./config')
const { debug } = require('../utils/constant')
const { isObject } = require('../utils')

function connect() {
   return msyql.createConnection({
      host,
      user,
      password,
      database,
      multipleStatements: true
   })
}
function querySql(sql) {
   const conn = connect()
   debug && console.log(sql)
   return new Promise((resovle, reject) => {
      try {
         conn.query(sql, (err, res) => {
            if (err) {
               debug && console.log('失败原因：', JSON.stringify(err))
               reject(err)
            } else {
               debug && console.log('成功：', JSON.stringify(res))
               resovle(res)
            }
         })
      } catch (e) {
         reject(e)
      } finally {
         conn.end()
      }
   })
}
function queryOne(sql) {
   return new Promise((resovle, reject) => {
      querySql(sql).then(res => {
         if (res && res.length > 0) {
            resovle(res[0])
         } else {
            resovle(null)
         }
      }).catch(e => {
         reject(e)
      })
   })
}
function insert(model, tableName) {
   return new Promise((resovle, reject) => {
      if (!isObject(model)) {
         reject(new Error('插入数据库失败'))
      } else {
         const keys = []
         const values = []
         Object.keys(model).forEach(key => {
            if (model.hasOwnProperty(key)) {
               keys.push(`\`${key}\``)
               values.push(`'${model[key]}'`)
            }
         })
         if (keys.length > 0 && values.length > 0) {
            let sql = `INSERT INTO \`${tableName}\``
            const keysString = keys.join(',')
            const valueString = values.join(',')
            sql = `${sql} (${keysString}) VALUES (${valueString})`
            debug && console.log(sql)
            const conn = connect()
            try {
               conn.query(sql, (err, result) => {
                  if (err) {
                     reject(err)
                  } else {
                     resovle(result)
                  }
               })
            } catch (e) {
               reject(e)
            } finally {
               conn.end()
            }
         } else {
            reject(new Error('插入数据库失败，对象不合法'))
         }
      }
   })
}
function update(model, tableName, where) {
   return new Promise((resovle, reject) => {
      if (!isObject(model)) {
         reject(new Error('插入数据库失败'))
      } else {
         const entry = []
         Object.keys(model).forEach(key => {
            if (model.hasOwnProperty(key)) {
               entry.push(`\`${key}\`='${model[key]}'`)
            }
         })
         if (entry.length > 0) {
            let sql = `UPDATE \`${tableName}\` SET`
            sql = `${sql} ${entry.join(',')} ${where}`
            const conn = connect()
            try {
               conn.query(sql, (err, result) => {
                  console.log('query',result)
                  if (err) {
                     reject(err)
                  } else {
                     resovle(result)
                  }
               })
            } catch (e) {
               reject(e)
            } finally {
               conn.end()
            }
         }
      }
   })
}
function and(where,k,v){
    if(where=='where'){
        return `${where} \`${k}\` = '${v}'`
    }else{
      return `${where} and \`${k}\` = '${v}'`
    }
}
function andLike(where,k,v){
   if(where=='where'){
       return `${where} \`${k}\` like '%${v}%'`
   }else{
     return `${where} and \`${k}\` like '%${v}%'`
   }
}
module.exports = {
   querySql,
   queryOne,
   insert,
   update,
   and,
   andLike
}