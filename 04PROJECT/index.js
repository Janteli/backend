// require('dotenv').config({path: './env'})
import "dotenv/config.js"
import connectDB from "./src/db/index.js";
import { app } from "./src/app.js";





connectDB()
.then(() =>{
    app.listen(process.env.PORT || 8000, () => {
        console.log(` Server is running at port : ${process.env.PORT}`);
        app.on("error", (error)=>{
            console.log("ERR", error);
            throw error
        })
    })
})
.catch((err)=>{
    console.log( "MongoDB connection failed !!!", err );
})








/*
import express from "express";
const app = express()

(async ()=>{
    try{
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error", (error) => {
            console.log("ERR:", error);
            throw error
        })
        app.listen(process.env.PORT, ()=>{
            `App is listening on port ${process.env.PORT}`
        })
    }catch(error){
        console.log("ERROR:", error)
    }
})()*/