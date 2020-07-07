const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')

const staplesDB = require('./mongoLib')
var ImageKit = require('imagekit')

let app = express();

app.use(cors())
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json())

app.get('/test', (req, res) => {
    res.json({message: 'Hello World'})
})

app.get('/allProducts', (req, res) => {
    
    staplesDB.getDB().collection('items').find({}).toArray((err, documents) => {
        if(err){
            console.log(err);
        }
        else {
            res.json(documents);
        }
    })
 
})

/*
    TODO:
    get request where a string is passed from the front end to the back end
    and pass that string into external library module and generate data from it

    May no longer be needed
*/
app.get('/:str', (req, res) => {
    const string = req.params.str;

    // note need to create text index in command line

    let queryString = { '$text': {'$search': string}};
    let score = {'score': {'$meta': 'textScore'}};


    staplesDB.getDB().collection('items').find(queryString, score).project(score).sort(score).toArray( (err, documents) => {
        
        if(err) {
            console.log(err);
        }
        else {
            res.json(documents);
        }
    });

})

app.get('/item/:id', (req, res) =>{
    
    const itemNumber = parseInt(req.params.id);
    
    let queryString = {'_id' : itemNumber};

    staplesDB.getDB().collection('items').find(queryString).toArray( (err, documents) => {
        
        if(err){
            console.log(err);
        }
        else { 
            res.json(documents);
        }
    });
})

app.post('/products/add', (req, res) => {
    // need to parse string to int to maintain uniformity and to not have duplicates
    let id = parseInt(req.body.id);
    let name = req.body.name;

    staplesDB.getDB().collection('items').insertOne({_id: id, Name: name}, (err, documents) => {
        
        //error handling with error messages returned to the page
        if(err){
            if(err.code == 11000){
                res.json({message: 'There already exists a product with that SKU'})
            }

            res.json({message: 'There was some sort of Error adding product to database'})
        }

        if(documents.insertedId == id){
            res.json({message: 'Product was added to database successfully'})
        }
        
    })

})

app.post('/products/rename', (req, res) => {
    let id = parseInt(req.body.id);
    let name = req.body.name;

    staplesDB.getDB().collection('items').updateOne({ _id: id}, { $set: {Name: name }}, (err, documents) => {
        // basic error handling for error in database
        if(err){
            res.json({message: 'Error occurred when trying to change product Name'})
            return;
        }

        // error message handling for different specific errors
        if(documents.matchedCount === 0){
            res.json({message: 'No Product was found with the entered id'})
        }

        if(documents.modifiedCount === 1){
            res.json({message: 'Product Name was modified Sucessfully'})
        }

    })
})

app.post('/products/locations', (req, res) => {
    //console.log("request for adding location has been recieved")

    let id = parseInt(req.body.id)
    let location = req.body.location

    staplesDB.getDB().collection('items').updateOne({_id: id}, {$push: {locations: location}}, (err, documents) => {
        //
        if(err){
            res.json({message: 'Error occurred when adding location to product.'})
        }

        //console.log(documents);

        //
        if(documents.matchedCount === 0){
            res.json({message: 'No Product was found with the entered id.'})
        }

        if(documents.modifiedCount === 1){
            res.json({message: 'Location was added to the product info.'})
        }
    })
})

app.post('/products/price', (req, res) => {
    let id =  parseInt(req.body.id)
    let price = parseInt(req.body.price)

    staplesDB.getDB().collection('products').updateOne({_id: id}, {$set: {price: price}}, (err, documents) => {
        if(err){
            res.json({message: 'Error occurred when adding price to product.'})
        }

        if(documents.matchedCount === 0){
            res.json({message: 'No Product was found with the entered id.'})
        }

        if(documents.modifiedCount === 1){
            res.json({message: 'New Price was added to the product info.'})
        }
    })
})

/*

    TODO: Clearn up image handling now that base64 string is passed instead

*/
app.post('/products/images',  (req, res) => {

    // setting up credentials for imagekit object
    const imageKit = new ImageKit({
        publicKey: loginInfo.publicKey,
        privateKey: loginInfo.privateKey,
        urlEndpoint: loginInfo.UrlEndpoint
    });

    // variables passed from request for database handling
    const productBASE64 = req.body.base64String;
    const name = req.body.fileName;
    const id = parseInt(req.body.new_id)

    // actual upload method
    imageKit.upload({
        file: productBASE64,
        fileName: name
    }, function(error, result) {
        if(error){
            console.log(error)
            res.json({message: 'error uploading image'})
        }
        else{
            console.log(result)

            let imageUrl = result.url
            let thumbnailUrl = result.thumbnailUrl

            staplesDB.getDB().collection('items').updateOne({_id:id}, {$push: {images: imageUrl , thumbnails:thumbnailUrl}}, (err, documents) => {

                if(err){
                    res.json({message: 'error occured when uploading info to database'})
                }

                if(documents.matchedCount === 0){
                    res.json({message: 'No Product was found with the entered id.'})
                }
        
                if(documents.modifiedCount === 1){
                    res.json({message: 'New Image was added to the product info.'})
                }

            })
        }
    })


    //res.json({message: `file ${req.file.originalname} was recieved`})


})


staplesDB.connect((err) => {
    if(err) {
        console.log('Unable to connect to database');
        process.exit(1);
    }
    else {
        app.listen(process.env.PORT|| 8080, () => {
            console.log('Connected on port 8080')
        })
    }
})



