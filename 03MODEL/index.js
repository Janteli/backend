const express = require('express')
const app = express()
port= 3000;

app.listen(port, ()=>{
    console.log(`Server is runnint at : ${port}`)
})