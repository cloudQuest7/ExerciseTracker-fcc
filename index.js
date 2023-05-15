const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const uniqid = require('uniqid'); 
require('dotenv').config()

app.use(cors())
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static('public'))


// Mongoose config
mongoose.connect(process.env.DB_URI)

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error: "));
db.once("open", function () {
  console.log("Connected successfully");
});

const Schema = mongoose.Schema
const userSchema = new Schema({
  _id: String,
  username: String,
  count: {
    type: Number,
    default: 0
  },
  log: [{
    description: String,
    duration: Number,
    date: String
  }]
})

const User = mongoose.model("User", userSchema)


app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.get('/api/users', async(req, res) => {
  let all = await User.find({})

  res.json(all)
})

app.get('/api/users/:_id/logs', async (req, res) => {
  let idInput = req.params._id

  let fromInput = req.query.from ? req.query.from : new Date(1980, 01, 01)
  let toInput = req.query.to ? req.query.to : new Date(2100, 10, 10)
  let limitInput = req.query.limit ? req.query.limit : 500

  let findOne = await User.findById(idInput)

  let log = findOne.log.filter((item) => {
    return new Date(item.date) >= new Date(fromInput) &&
    new Date(item.date) <= new Date(toInput);
  } )

  if(findOne) {
    res.json({
      _id: findOne._id,
      username: findOne.username,
      count: findOne.count,
      log: log.slice(0, limitInput)
    })
  } else {
    res.json({
      error: "Somethig wrong happened"
    })
  }


})

app.post('/api/users', async(req, res) => {
  let userNameInput = req.body.username
  let findOne = await User.findOne({
    userName: userNameInput
  })

  if(findOne) {
    res.json({
      username: findOne.username,
      _id: findOne._id,
    })
  } else {
    findOne = new User ({
      username: userNameInput,
      _id: new mongoose.Types.ObjectId()
    })

    await findOne.save()

    res.json({
      username: findOne.username,
      _id: findOne._id
    })
  }
})

app.post('/api/users/:_id/exercises', async (req, res) => {

  let idInput = req.params._id
  let descriptionInput = req.body.description
  let durationInput = req.body.duration
  let dateInput = req.body.date ? new Date(req.body.date).toDateString() : new Date().toDateString()
  let findOne = await User.findById(idInput)

  if(findOne) {
    findOne.log.push({
      description: descriptionInput,
      duration: durationInput,
      date: dateInput
    })

    findOne.count = findOne.log.length

    await findOne.save()

    res.json({
      _id: findOne._id,
      username: findOne.username,
      date: findOne.log[findOne.count - 1].date,
      duration: findOne.log[findOne.count - 1].duration,
      description: findOne.log[findOne.count - 1].description
    })
  } else {
    res.json({
      error: "Something wrong happened!"
    })
  }

})





const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
