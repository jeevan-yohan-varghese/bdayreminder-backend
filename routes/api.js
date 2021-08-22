const router = require('express').Router();
const verifyApiKey = require('../middlewares/verify-apikey');
const verifyUserAuth = require('../middlewares/verify-user-auth');
const User = require('../models/user-model');
const Person = require('../models/person-model');
const axios = require('axios');
router.get('/', (req, res, next) => {

    res.send("Check documentation for endpoints");
});

const changeYear = (mPerson) => {
    console.log(typeof mPerson);
    let cDate = mPerson.dob;
    cDate.setFullYear(2021);
    let newPerson = mPerson;
    newPerson.dob = cDate;
    return newPerson;
};
//A sample route which requires authorization
router.get('/requireAuth', verifyApiKey, verifyUserAuth, (req, res, next) => {
    res.send(`Welcome ${req.currentUser._name}`);
});

//Add new person
router.post('/addPerson', verifyApiKey, verifyUserAuth, (req, res, next) => {
    if (!req.body.name || !req.body.dob) {
        return res.status(400).json({ succes: false, msg: "Some parameters are missing.  Check documentation" });

    }
    const bDate = new Date(req.body.dob);
    const newPerson = new Person({ name: req.body.name, dob: bDate });
    User.findOne({ email: req.currentUser._email }).then((currentUser) => {
        let currPeopleList = currentUser.peopleList;
        currPeopleList.push(newPerson);
        User.updateOne({ email: req.currentUser._email }, { $set: { peopleList: currPeopleList } }).then((updatedUser) => {
            res.json({ succes: true, msg: "Person added" });
        })
    });





});
//Get Persons
router.get('/listPersons', verifyApiKey, verifyUserAuth, (req, res, next) => {
    User.findOne({ email: req.currentUser._email }).then((currentUser) => {
        let peopleList = currentUser.peopleList;
        res.json({ succes: true, data: peopleList });
    });
});
//Delete a person
router.delete('/deletePerson', verifyApiKey, verifyUserAuth, (req, res, next) => {
    if (!req.body.personId) {
        return res.status(400).json({ succes: false, msg: "Required parameters not found" });
    }
    User.findOne({ email: req.currentUser._email }).then((currentUser) => {
        let currentPeopleList = currentUser.peopleList;
        let originalLen = currentPeopleList.length;
        for (let i = 0; i < currentPeopleList.length; i++) {
            console.log(typeof currentPeopleList[i]._id.toString());
            if (currentPeopleList[i]._id.toString() === req.body.personId) {
                console.log("Found person");
                currentPeopleList.splice(i, 1);

            }
        }
        if (originalLen === currentPeopleList.length) {
            return res.json({ success: false, msg: "Could not find id" });
        }
        User.updateOne({ email: currentUser.email }, { $set: { peopleList: currentPeopleList } }).then(() => {

            //console.log(peopleList);
            return res.json({ succes: true, msg: "Person Deleted", data: currentPeopleList })
        });


    });
});

//Update a person
router.patch('/updatePerson', verifyApiKey, verifyUserAuth, (req, res, next) => {
    if (!req.body.personId || !req.body.name || !req.body.dob) {
        return res.status(400).json({ succes: false, msg: "Required parameters not found" });
    }
    User.findOne({ email: req.currentUser._email }).then((currentUser) => {
        let currentPeopleList = currentUser.peopleList;

        for (let i = 0; i < currentPeopleList.length; i++) {
            console.log(typeof currentPeopleList[i]._id.toString());
            if (currentPeopleList[i]._id.toString() === req.body.personId) {
                console.log("Found person");
                currentPeopleList[i].name = req.body.name;
                currentPeopleList[i].dob = req.body.dob;


            }
        }

        User.updateOne({ email: currentUser.email }, { $set: { peopleList: currentPeopleList } }).then(() => {

            console.log(currentPeopleList);
            return res.json({ succes: true, msg: "Person Updated", data: currentPeopleList })
        });


    });
});

//Todays birthdays
router.get('/bornToday', verifyApiKey, verifyUserAuth, (req, res, next) => {
    User.findOne({ email: req.currentUser._email }).then((currentUser) => {
        let peopleList = currentUser.peopleList;
        peopleList.forEach((mPerson) => {
            let mDob = new Date(mPerson.dob);
            mDob.setFullYear(2021);
            console.log(mDob);
            mPerson.dob = mDob;
        });

        let todaysList = peopleList.filter((mPerson) => {
            let mDob = new Date(mPerson.dob);
            let today = new Date();
            return mDob.getDate() === today.getDate() && mDob.getMonth() === today.getMonth();
        })

        res.json({ succes: true, data: todaysList });
    });
});


const isAfter = (d1, d2) => {
    console.log("Is after called");
    let date1 = new Date(d1.dob);
    let date2 = new Date(d2.dob);
    console.log(`Date1: ${date1} Date 2: ${date2}`);

    if (date1.getDate() > date2.getDate() && date1.getMonth() === date2.getMonth()) {
        return 1;
    } else if (date1.getMonth() > date2.getMonth()) {
        return 1;
    } else if (date1.getDate() < date2.getDate && date1.getMonth() === date2.getMonth()) {
        return -1;
    } else if (date1.getMonth() < date2.getMonth()) {
        return -1;
    }

    return 0;

};
//Top upcoming
router.get('/topUpcoming', verifyApiKey, verifyUserAuth, (req, res, next) => {
    User.findOne({ email: req.currentUser._email }).then((currentUser) => {
        let peopleList = currentUser.peopleList;

        //List of persons born after todays date
        let greaterList = peopleList.filter((mPerson) => {
            let mDob = new Date(mPerson.dob);
            let today = new Date();
            return (mDob.getDate() > today.getDate() && mDob.getMonth() === today.getMonth()) ||
                (mDob.getMonth() > today.getMonth());
        });
        let sortedList = greaterList.sort(isAfter);

        res.json({ succes: true, data: sortedList });
    });
});
//Add new person
router.post('/verifyChannelID', verifyApiKey, verifyUserAuth, (req, res, next) => {
    if (!req.body.channelId) {
        return res.status(400).json({ succes: false, msg: "Some parameters are missing.  Check documentation" });

    }

    try {
        let msg = Math.floor(1000 + Math.random() * 9000).toString();
        console.log(encodeURI(req.body.channelId));
        console.log(process.env.BOT_TOKEN);
        console.log(req.body.channelId);
        axios.get(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage?chat_id=@${req.body.channelId}&text=${msg}`).then(response => {
            res.json({
                succes: true,
                msg: `Success`,
                token: msg
            });

        }).catch(error => {
            res.status(502).send(`Error from telegram api :${error} `);

        });

    } catch {
        next();
    }





});
//Add new person
router.post('/updateChannelId', verifyApiKey, verifyUserAuth, (req, res, next) => {
    if (!req.body.channelId) {
        return res.status(400).json({ succes: false, msg: "Some parameters are missing.  Check documentation" });

    }

    User.findOne({ email: req.currentUser._email }).then((currentUser) => {

        User.updateOne({ email: req.currentUser._email }, { $set: { channelId: req.body.channelId } }).then((updatedUser) => {
            res.json({ succes: true, msg: "Channel ID updated" });
        })
    });





});

module.exports = router;