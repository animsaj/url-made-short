var express = require("express");
var mongoose = require("mongoose");
var validUrl = require('valid-url');

var app = express();
app.use("/", express.static(__dirname + '/public'));
//connect to db
var url = 'mongodb://' + process.env.DB_USER + ':' + process.env.DB_PASSWORD + '@ds011765.mlab.com:11765/' + process.env.DB_NAME;
mongoose.connect(url);
//Schema definition
var urlSchema = new mongoose.Schema({
    longUrl: String,
    shortUrl: String
});
var Url = mongoose.model("Url", urlSchema);
//helper function
function* Shortener () {
    let shortUrl = 0;
    while(true) {
        yield ++shortUrl;
    }
}
var shortenerIterator = Shortener();
//======
//ROUTES
//======
app.get("/new/:url(*)", function (req, res) {
    Url.findOne({ longUrl: req.params.url }, { longUrl: 1, shortUrl: 1, _id: 0 }, function (err, doc) {
        if(err) {
            console.log(err);
        } else if(doc) {
            res.json(doc);
        } else {
            if (validUrl.isUri(req.params.url)){
                Url.create({
                    longUrl: req.params.url,
                    shortUrl: req.protocol + '://' + req.get('host') + '/' + shortenerIterator.next().value
                }, function (err, urlCreated) {
                    if(err) {
                        console.log(err);
                    } else {
                        res.json({ longUrl: urlCreated.longUrl, shortUrl: urlCreated.shortUrl });
                    }
                });
            } else {
                res.json({ error: 'You have to provide valid Url' });
            }
        }
    });
});

app.get("/:short", function (req, res) {
    Url.findOne({ shortUrl: req.protocol + '://' + req.get('host') + '/' + req.params.short }, { longUrl: 1, _id: 0 }, function (err, doc) {
        if(err) {
            console.log(err);
        } else if(doc) {
            res.redirect(doc.longUrl);
        } else {
            res.json({ error: "Short link not found in the database"});
        }
    });
});


app.listen(process.env.PORT || 3000, function () {
    console.log("App has started...");
});
