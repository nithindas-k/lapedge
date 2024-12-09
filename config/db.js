const mongoose =require("mongoose")
require("dotenv").config()

const connectdb = async ()=>{
    try {
           await mongoose.connect(process.env.MONGODB_URI)
           console.log("DB connected")
    }catch(error){
            console.log("DB conection error ",error.message)
            process.exit(1)
    }
}
module.exports=connectdb;