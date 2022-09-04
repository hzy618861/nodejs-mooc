const UPLOAD_PATH = './books'
module.exports = {
    CODE_ERROR: -1,
    CODE_SUCCESS: 0,
    debug: true,
    PWD_SALT: 'admin_node',  //jwt密钥
    PRIVATE_KEY: 'hzy_asdasdasdad',
    JWT_EXPIRED: 60*60*2,
    TOKEN_ERROR: -2,
    UPLOAD_PATH,
    MIME_TYPE_EPUB: 'application/epub+zip'
}