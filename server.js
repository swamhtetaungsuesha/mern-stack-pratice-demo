console.log('hello from node')
const express = require("express")
const {MongoClient, ObjectId} = require("mongodb")
const app = express()
const multer = require('multer')
const upload = multer()
const sanitizeHTML = require('sanitize-html')
const fse = require('fs-extra')
const path = require('path')
const sharp = require("sharp")
const React = require('react')
const ReactDomServer = require('react-dom/server')
const AnimalCard = require('./src/components/AnimalCard').default
let db

app.set('view engine','ejs')
app.set("views","./views")
app.use(express.static('public'))
app.use(express.json())
app.use(express.urlencoded({extended:false}))

fse.ensureDirSync(path.join('public','upload-photos'))

function passwordProtection(req,res,next){
    res.set("WWW-Authenticate","Basic realm='Our MERN App'")
    if(req.headers.authorization=='Basic YWRtaW46YWRtaW4='){
        next()
    }else{
        console.log(req.headers.authorization)
        res.status(401).send('Try again!')
    }
}

app.get('/',async(req,res)=>{
    const AllAnimals = await db.collection("animals").find().toArray()
    const generatedHtml = ReactDomServer.renderToString(
        <div className="container">
            <div className="animal-grid">

                {
                    AllAnimals.map(animal=>(
                        <AnimalCard key={animal._id} name={animal.name} species={animal.species} id={animal._id} photo={animal.photo} readOnly={true}/>
                    ))
                }
            </div>
            <p><a href="/admin">Login / manage the animal listings</a></p>
        </div>
    )
    res.render("home",{generatedHtml})
})

app.use(passwordProtection)

app.get('/admin',(req,res)=>{
    res.render('admin')
})

app.get('/api/animals',async(req,res)=>{
    const AllAnimals = await db.collection("animals").find().toArray()
    res.json(AllAnimals)
})

app.delete('/animal/:id',async(req,res)=>{
    if(typeof req.params.id !='string') req.params.id = ''
    const item = await db.collection('animals').findOne({_id:new ObjectId(req.params.id)})
    if(item.photo){
        fse.remove(path.join('public','upload-photos',item.photo))
    }
    await db.collection("animals").deleteOne({_id:new ObjectId(req.params.id)})
    res.send('Good Job!')
})

app.post('/update-animal',upload.single('photo'),ourCleanup,async(req,res)=>{
    if(req.file){
        const photofilename = `${Date.now()}.jpg`
        await sharp(req.file.buffer).resize(844,456).jpeg({quality:60}).toFile(path.join('public','upload-photos',photofilename))
        req.cleanData.photo = photofilename
        const info = await db.collection('animals').findOneAndUpdate({_id:new ObjectId(req.body._id)},{$set:req.cleanData})
        if(info.value.photo){
            fse.remove(path.join('public','upload-photos',info.value.photo))
        }
        res.send(photofilename)
    }else{
       db.collection('animals').findOneAndUpdate({_id:new ObjectId(req.body._id)},{$set:req.cleanData})
       res.send(false)
    }
   
})

app.post('/create-animal',upload.single('photo'),ourCleanup,async(req,res)=>{
    if(req.file){
        const photofilename = `${Date.now()}.jpg`
        await sharp(req.file.buffer).resize(844,456).jpeg({quality:60}).toFile(path.join('public','upload-photos',photofilename))
        req.cleanData.photo = photofilename
    }
    console.log(req.body)
   const info = await db.collection('animals').insertOne(req.cleanData)
   const newAnimal = await db.collection('animals').findOne({_id:new ObjectId(info.insertedId)})
    res.send(newAnimal)
})

async function ourCleanup(req,res,next){
    if(typeof req.body.name!='string') req.body.name = ""
    if(typeof req.body.species!='string') req.body.species = ""
    if(typeof req.body._id!='string') req.body._id = ""

    req.cleanData= {
        name : sanitizeHTML(req.body.name.trim(),{allowedTags:[],allowedAttributes:{}}),
        species : sanitizeHTML(req.body.species.trim(),{allowedTags:[],allowedAttributes:{}}),
    }

    next()
}

async function start(){
    const client = new MongoClient('mongodb+srv://SwamHtetAung:5115suesha76@cluster0.xi3u3ee.mongodb.net/mern_db?retryWrites=true&w=majority')
    await client.connect()
    db = client.db()
    
    app.listen(3000)
}

start()