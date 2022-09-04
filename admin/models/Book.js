const { MIME_TYPE_EPUB } = require("../utils/constant")
const Epub = require('../utils/epub')
const fs = require('fs')
const path = require('path')
const xml2js = require('xml2js').parseString
class Book {
    constructor(file, data) {
        if (file) {
            this.createBookFromFile(file)
        } else {
            this.createBookFromData(data)
        }

    }
    createBookFromFile(file) {
        const { destination, filename, path, originalname, mimetype = MIME_TYPE_EPUB } = file
        const suffix = mimetype === MIME_TYPE_EPUB ? '.epub' : ''
        const oldBookPath = path
        const newBookPath = `${destination}/${filename}${suffix}`
        const url = `localhost:3000/books/${filename}${suffix}`
        //电子书解压地址
        const unzipPath = `./unzip/${filename}`
        //生成unzip文件路径
        if (!fs.existsSync(unzipPath)) {
            fs.mkdirSync(unzipPath, { recursive: true })
        }
        //文件重命名 加上.epub
        if (fs.existsSync(oldBookPath) && !fs.existsSync(newBookPath)) {
            fs.renameSync(oldBookPath, newBookPath)
        }
        this.filenName = filename  //文件名
        this.path = `books/${filename}${suffix}` //epub相对路径
        this.filePath = path //保存路径
        this.unzipPath = `/unzip/${filename}` //解析文件夹链接
        this.url = url  //下载链接
        this.title = '' //书名 
        this.author = '' //作者
        this.publisher = '' //出版社
        this.contents = [] //目录
        this.cover = '' //封面图片
        this.category = -1 // 分类ID
        this.categoryText = '' //分类名称
        this.language = '' //语种
        this.originalname = originalname //电子书原名
    }
    createBookFromData(data) {
          this.fileName = data.fileName
          this.cover = data.coverPath
          this.title = data.title
          this.author = data.author
          this.publisher = data.publisher
          this.bookId = data.fileName
          this.language = data.language
          this.rootFile = data.rootFile
          this.originalName = data.originalName
          this.path = data.path || data.filenPath
          this.filenPath = data.path || data.filenPath
          this.unzipPath = data.unzipPath
          this.coverPath = data.coverPath
          this.createUser = data.username
          this.createDt = new Date().getTime()
          this.updateDt = new Date().getTime()
          this.updateType = data.updateType == 0? data.updateType : 1
          this.category = data.category || 99
          this.categoryText = data.categoryText || '自定义'
          this.contents = data.contents || []
    }
    getContents(){
       
       return this.contents
    }
    parse() {
        return new Promise((resolve, reject) => {
            const bookPath = this.path
            if (!fs.existsSync(bookPath)) {
                reject(new Error('电子书路径不存在'))
                return
            }
            const epub = new Epub(bookPath)
            epub.on('error', err => {
                reject(err)
            })
            epub.on('end', err => {
                if (err) {
                    reject(err)
                } else {
                    const { title, language, creator, publisher, cover, creatorFileAs } = epub.metadata
                    if (!title) {
                        reject(new Error('图书标题为空'))
                    } else {
                        this.title = title
                        this.language = language || 'en'
                        this.author = creator || creatorFileAs || 'unknow'
                        this.publisher = publisher || 'unknow'
                        this.rootFile = epub.rootFile
                        //获取封面图
                        const handleGetImage = (err, file, mimeType) => {
                            //file为Buffer 在内存中   mimeType: ex: image/jpeg
                            if (err) {
                                reject(err)
                            } else {
                                const suffix = mimeType.split('/')[1]
                                const coverPath = `./books/img/${this.filenName}.${suffix}`
                                if (!fs.existsSync('./books/img')) {
                                    fs.mkdirSync('./books/img', { recursive: true })
                                }
                                // Buffer 写入磁盘
                                fs.writeFileSync(coverPath, file, 'binary')
                                this.coverPath = coverPath
                                this.cover = coverPath
                                resolve(this)
                            }
                        }
                        try {
                            this.unzip() //解压
                            this.parseContent(epub).then(({chapters,chapterTree})=>{
                                  this.contents = chapters
                                  this.chapterTree = chapterTree
                                  epub.getImage(cover, handleGetImage)
                            }).catch(err=>reject(err))
                   
                        } catch (e) {
                            reject(e)
                        }

                    }

                }
            })
            epub.parse()

        })

    }
    static pathExists(path) {
        if (path.startsWith('./unzip')) {
          return fs.existsSync(path)
        } else {
          return fs.existsSync((path))
        }
    }   
    static getContentsTree(book){
      const {contents} = book
       if(contents){
        const chapterTree = []
        contents.forEach(c => {
          c.children = []
          if (c.pid === '') {
            chapterTree.push(c)
          } else {
            const parent =  contents.find(_ => _.navId === c.pid)
            if(parent){
              parent.children = []
              parent.children.push(c)
            }
          }
        }) // 将目录转化为树状结构
        return chapterTree
       }
    }
    reset() {
        if (this.path && Book.pathExists(this.path)) {
          fs.unlinkSync((this.path))
        }
        if (this.filePath && Book.pathExists(this.filePath)) {
          fs.unlinkSync((this.filePath))
        }
        if (this.coverPath && Book.pathExists(this.coverPath)) {
          fs.unlinkSync((this.coverPath))
        }
        if (this.unzipPath && Book.pathExists(this.unzipPath)) {
          // 注意node低版本将不支持第二个属性
          fs.rmdirSync((this.unzipPath), { recursive: true })
        }
    }
    toJson() {
        return {
          path: this.path,
          url: this.url,
          title: this.title,
          language: this.language,
          author: this.author,
          publisher: this.publisher,
          cover: this.cover,
          coverPath: this.coverPath,
          unzipPath: this.unzipPath,
          unzipUrl: this.unzipUrl,
          category: this.category,
          categoryText: this.categoryText,
          contents: this.contents,
          chapterTree: this.chapterTree,
          originalName: this.originalName,
          rootFile: this.rootFile,
          fileName: this.fileName,
          filePath: this.filePath
        }
      }
    unzip() {
        const AdmZip = require('adm-zip')
        const zip = new AdmZip(this.path)
        zip.extractAllTo(`./unzip/${this.filenName}`, true)
    }
    parseContent(epub) {
        function getNcxFilePath() {
            const spine = epub && epub.spine
            const manifest = epub && epub.manifest
            const ncx = spine.toc && spine.toc.href
            const id = spine.toc && spine.toc.id
            if (ncx) {
                return ncx
            } else {
                return manifest[id].href
            }
        }
        function findParent(array,level =0,pid = ''){
            return array.map(item => {
                item.level = level
                item.pid = pid
                if (item.navPoint && item.navPoint.length) {
                  item.navPoint = findParent(item.navPoint, level + 1, item['$'].id)
                } else if (item.navPoint) {
                  item.navPoint.level = level + 1
                  item.navPoint.pid = item['$'].id
                }
                return item
              })
        }
        function flatten(array) {
            return [].concat(...array.map(item => {
              if (item.navPoint && item.navPoint.length) {
                return [].concat(item, ...flatten(item.navPoint))
              } else if (item.navPoint) {
                return [].concat(item, item.navPoint)
              } else {
                return item
              }
            }))
        }
        const ncFilePath = `.${this.unzipPath}/${getNcxFilePath()}`
        const fileName = this.filenName
        if (fs.existsSync(ncFilePath)) {
            return new Promise((resolve, reject) => {
              const xml = fs.readFileSync(ncFilePath,'utf-8')
              const dir = path.dirname(ncFilePath).replace('.','')
              console.log('dir:',dir)
              xml2js(xml,{
                 explicitArray: false,
                 ignoreAttrs: false  
              },function(err,json){
                  if(err){
                    reject(err)
                  }else{
                     const navMap = json.ncx.navMap
                     if(navMap.navPoint && navMap.navPoint.length>0){
                         navMap.navPoint = findParent(navMap.navPoint)
                         const newNavMap = flatten(navMap.navPoint)
                         const chapters = []
                         newNavMap.forEach((chapter,index)=>{
                              const src = chapter.content['$'].src
                              chapter.id = `${src}`
                              chapter.href = `${dir}/${src}`
                              chapter.text = `./unzip${dir}/${src}`
                              chapter.label = chapter.navLabel.text || ''
                              chapter.navId = chapter['$'].id
                              chapter.fileName = fileName
                              chapter.order = index+1
                              chapters.push(chapter)
                         })
                         const chapterTree = []
                         chapters.forEach(c => {
                           c.children = []
                           if (c.pid === '') {
                             chapterTree.push(c)
                           } else {
                             const parent = chapters.find(_ => _.navId === c.pid)
                             parent.children.push(c)
                           }
                         }) // 将目录转化为树状结构
                         resolve({ chapters, chapterTree })
                     }else{
                         reject(new Error('目录解析失败，目录为0'))
                     }
                  }
              })

            })
        } else {
            throw new Error('目录文件不存在')
        }
    }
    toDb(){
       return {
        fileName:  this.fileName,
        cover :  this.coverPath,
        title :  this.title,
        author :  this.author,
        publisher :  this.publisher,
        bookId :  this.fileName,
        language :  this.language,
        rootFile :  this.rootFile,
        originalName :  this.originalName,
        unzipPath :  this.unzipPath,
        coverPath :  this.coverPath,
        createUser :  this.createUser,
        createDt :  this.createDt,
        updateDt :  this.updateDt,
        updateType :  this.updateType,
        category :  this.category,
        categoryText :  this.categoryText
       }
    }
}
module.exports = Book