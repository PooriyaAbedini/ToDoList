const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const ejs = require('ejs');
const {
    link
} = require('fs');
const date = require(__dirname + "/date.js");
const app = express();
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const session = require('express-session');
const LocalStrategy = require('passport-local').Strategy;

//Connecting mongoose to atlas
mongoose.connect('mongodb://127.0.0.1:27017/toDoListDB')



app.use(session({
    secret: "My beautiful secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
        expires: false
    }
}));

//initializing passport and session:
app.use(passport.initialize());
app.use(passport.session());

//Schemas:
const usersSchema = new mongoose.Schema({
    username: String,
    password: String
});

const itemSchema = new mongoose.Schema({
    item: {
        type: String,
        required: [true, "There is no item to add!"]
    }
});

const listSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "There is no item to add!"]
    },
    items: [itemSchema]
});


usersSchema.plugin(passportLocalMongoose);

//Models:
const List = mongoose.model("List", listSchema);
const User = mongoose.model('User', usersSchema);
const Item = mongoose.model("Item", itemSchema);

//Passport requirments:
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());



//EJS:
app.set('view engine', 'ejs');

// bodyParser:
app.use(bodyParser.urlencoded({
    extended: true
}));

//Public folder (CSS):
app.use(express.static(__dirname + "/public"))




// Requests:

app.get('/', (req, res) => {

    res.render('home');

});


app.route('/signup')
    .get((req, res) => {
        res.render('signup')
    })
    .post((req, res) => {
        const email = req.body.username;
        const password = req.body.password;

        User.register({
            username: email
        }, password, (err, user) => {
            if (err) {
                console.log('Something went wrong: ' + err)
                res.redirect('/signup');
            } else {
                passport.authenticate('local')(req, res, () => {
                    res.redirect('/todo');
                })
            }
        })
    });



app.route('/login')
    .get((req, res) => {
        res.render('login', {
            err: ""
        })
    })
    .post((req, res) => {
        const user = new User({
            username: req.body.username,
            password: req.body.password
        })

        req.login(user, (err) => {
            if (err) {
                console.log("Something went wrong: " + err)
            } else {

                passport.authenticate('local')(req, res, () => {

                    res.redirect('/todo');
                })
            }
        })
    });

app.get('/logout', (req, res) => {

    req.logOut((err) => {
        if (err) console.log(err);
        else res.redirect('/');
    })

});



//todo route:
app.route('/todo')
    .get((req, res) => {

        if (req.isAuthenticated()) {

            var itemsArr = []

            let findItems = new Promise((resolve, reject) => {

                resolve(listItems = Item.find());

            })

            findItems.then((listItems) => {
                listItems.forEach((one) => {
                    itemsArr.push(one)
                })

                let day = date.getDate();
                let dayNum = date.getNum();

                if (dayNum == 0 || dayNum == 6) res.render("list", {
                    dayName: day,
                    work: "Weekend!!!",
                    newItems: itemsArr,
                    feild: "Today"
                });
                else res.render("list", {
                    dayName: day,
                    work: "Have a nice day!!",
                    newItems: itemsArr,
                    feild: "Today"
                });
            })

        } else {

            res.redirect('/login')

        };


    }) //end of get request.

    .post((req, res) => {

        var listName = req.body.button;
        const addingItem = req.body.toDo;

        const newItem = new Item({
            item: addingItem
        });

        if (listName == "Today") {
            if (addingItem !== "") {
                newItem.save();
                res.redirect('/todo');
            } else {
                res.redirect('/todo');
            }
        } else {

            if (addingItem !== "") {
                const findOne = List.findOne({
                    name: listName
                });
                findOne.then(findOne.updateOne({
                    name: listName
                }, {
                    $push: {
                        "items": {
                            item: addingItem
                        }
                    }
                }));
                res.redirect(`/${listName}`);
            } else {
                res.redirect(`/${listName}`);
            }
        }
    }); //end of post request.





app.get('/:customListName', (req, res) => {

    const customListName = req.params.customListName;

    async function find() {
        var findAllArr = [];
        try {

            const findOne = await List.findOne({
                name: customListName
            });
            findAllArr.push(findOne)


            if (findOne == null) {
                const newItem = new List({
                    name: customListName,
                    items: []
                })
                newItem.save();
                console.log("New list item added")
                let day = date.getDate();
                let dayNum = date.getNum();
                if (dayNum == 0 || dayNum == 6) res.render("list", {
                    dayName: day,
                    work: "Weekend!!!",
                    newItems: itemsArr,
                    feild: customListName
                });
                else res.render("list", {
                    dayName: day,
                    work: "Have a nice day!!",
                    newItems: findAllArr[0].items,
                    feild: customListName
                });

            } else {

                let day = date.getDate();
                let dayNum = date.getNum();
                if (dayNum == 0 || dayNum == 6) res.render("list", {
                    dayName: day,
                    work: "Weekend!!!",
                    newItems: itemsArr,
                    feild: customListName
                });
                else res.render("list", {
                    dayName: day,
                    work: "Have a nice day!!",
                    newItems: findAllArr[0].items,
                    feild: customListName
                });

            }
        } catch (err) {
            res.redirect(`/${customListName}`)
        }

    };
    find();
});



app.post('/NewList', (req, res) => {

    const listName = req.body.listName;

    if (listName == "Today") {

        const deletingAllData = async () => {
            try {

                await Item.deleteMany()

            } catch (err) {
                console.log(`ERROR_Something went wrong: ${err}`);
            }

        };
        deletingAllData();
        res.redirect('/todo')

    } else {

        async function deletingAllData() {
            try {
                await List.updateOne({
                    name: listName
                }, {
                    items: []
                });
            } catch (err) {
                console.log(err);
            }
        }
        deletingAllData();
        res.redirect(`/${listName}`)
    }

})



app.post("/delete", (req, res) => {

    const listName = req.body.listName;

    if (listName == "Today") {

        async function deleteChecked() {
            const checkedName = req.body.checkbox;
            try {

                await Item.deleteOne({
                    item: checkedName
                })

            } catch (err) {
                console.log(err)
            }
        }
        deleteChecked();

        setTimeout(() => {
            res.redirect('/todo')
        }, 250)
    } else {

        async function deleteChecked() {
            const checkedName = req.body.checkbox;
            const listName = req.body.listName;
            try {

                await List.updateOne({
                    "name": listName
                }, {
                    $pull: {
                        "items": {
                            "item": checkedName
                        }
                    }
                });

            } catch (err) {

                console.log(err);

            }

        }
        deleteChecked();
        setTimeout(() => {
            res.redirect(`/${listName}`)
        }, 250);
    }
});

const prot = process.env.PORT || 3000;
app.listen(prot, () => {
    console.log("Serever is running on port 3000!");
})