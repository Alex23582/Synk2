const Minio = require('minio')

const MINIO_ACCESS_KEY = process.env.MINIO_ACCESS_KEY
const MINIO_SECRET_KEY = process.env.MINIO_SECRET_KEY

var minioClient = new Minio.Client({
    endPoint: process.env.MINIO_HOST,
    port: 9000,
    useSSL: false,
    accessKey: MINIO_ACCESS_KEY,
    secretKey: MINIO_SECRET_KEY,
})

module.exports = {minioClient}