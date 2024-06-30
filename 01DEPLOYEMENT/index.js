require('dotenv').config()
const express = require('express')
const app = express()
 port = process.env.PORT

app.get('/',(req,res)=>{
    res.send('Hello World')
})

app.get('/twitter',(req, res)=>{
    res.send('surazdotcom')
} )

app.get('/login',(req, res)=>{
    res.send('<h1>Please login at myApp</h1>')
})

app.get('/youtube', (req,res)=>{
    res.send("<h2>my backend</h2>")
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})