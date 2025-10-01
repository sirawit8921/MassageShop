const mongoose = require('mongoose');

//connect with database (async + await) -> รอคำสั่งจากข้างนอก
const connectDB = async ()=> {
    mongoose.set('strictQuery', true);
    const conn = await mongoose.connect(process.env.MONGO_URI); //await ต้องมี async มาก่อน

    console.log(`MongoDB Connected: ${conn.connection.host}`); //บอกตัวเองว่า connect MongoDB แล้ว
}


module.exports = connectDB; // ส่งออก connectDB ให้ไฟล์อื่นใช้ได้
