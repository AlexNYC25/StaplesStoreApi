const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')

let app = express();

app.use(cors())
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json())

app.get('/test', (req, res) => {
    res.json({message: 'Hello World'})
})

app.listen(process.env.PORT|| 8080, () => {
    console.log('Connected on port 8080')
})