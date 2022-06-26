require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const URL = require('url').URL;
const dns = require('dns')
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;
const mongoURI = process.env.MONGO_URI;

mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true});
let urlPairSchema = new mongoose.Schema({
  original_url: String,
  short_url: {type: Number, unique: true}
})
let UrlPair = mongoose.model('UrlPair', urlPairSchema);

app.use(cors());

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.raw());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.post('/api/shorturl', function(req, res){
  UrlPair.findOne().sort({_id: -1}).exec((err, data) => {
    if(err)
    {
      console.log('failed to find any data');
      console.log(err);
    }
    else
    {
      console.log('successfully found data, latest entry:');
      console.log(data);
      let shortUrl = data ? data.short_url + 1 : 1;
      try 
      {
        let newUrl = new URL(req.body.url);
        dns.lookup(newUrl.hostname, (err, address, family) => {
          if(err)
          {
            console.log('dns lookup failed');
            res.json({error: 'invalid url'});
          }
          else
          {
            let newPair = new UrlPair({original_url: req.body.url, short_url: shortUrl});
            newPair.save((err, createdData) => {
              if(err)
              {
                console.log('not successfull');
                console.log(err);
              }
              else
              {
                console.log('successfull')
                res.json({original_url: createdData.original_url, short_url: createdData.short_url});
              }
            })      
          }
        })
      } 
      catch (error) 
      {
        console.log('url parse failed');
        res.json({error: 'invalid url'});
      }
    }
  })
})

app.get('/api/shorturl/:short_url', (req, res) => {
  let url;
  UrlPair.findOne({short_url: Number(req.params.short_url)}, {}, {}, (err, data) => {
    if(err)
    {
      res.json({error: 'Wrong format'});
    }
    else if(!data)
    {
      res.json({error: 'No corresponding url'});
    }
    else
    {
      res.redirect(data.original_url);
    }
  })
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
