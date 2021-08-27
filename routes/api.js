const router = require('express').Router();
const verifyApiKey = require('../middlewares/verify-apikey');
const verifyUserAuth = require('../middlewares/verify-user-auth');
const User = require('../models/user-model');
const Person = require('../models/person-model');
const axios = require('axios');
const admin = require('firebase-admin');
const fs = require('fs');
const csv = require('fast-csv');
const multer = require('multer');
const moment = require('moment')

router.get('/', (req, res, next) => {

    res.send("Check documentation for endpoints");
});

const upload = multer({ dest: 'tmp/csv/' });

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

        User.updateOne({ email: req.currentUser._email }, { $set: { channelId: req.body.channelId, isTelegramTurnedOn: true } }).then((updatedUser) => {
            res.json({ succes: true, msg: "Channel ID updated" });
        })
    });





});

const validateCsvRow = (row) => {
    if (!row[0]) {
        return "invalid name"
    }

    else if (!moment(row[1], "YYYY-MM-DD").isValid()) {
        return "invalid date of birth"
    }
    return;
};

const validateCsvData = (rows) => {
    const dataRows = rows.slice(1, rows.length); //ignore header at 0 and get rest of the rows
    for (let i = 0; i < dataRows.length; i++) {
        const rowError = validateCsvRow(dataRows[i]);
        if (rowError) {
            return `${rowError} on row ${i + 1}`
        }
    }
    return;
}
//upload csv
router.post('/uploadCSV', verifyApiKey, verifyUserAuth, upload.single('file'), (req, res, next) => {
    if (!req.file) {
        return res.status(400).json({ success: false, msg: 'Invalid file' });
    }
    const fileRows = [];

    csv.parseFile(req.file.path)
        .on("data", function (data) {
            fileRows.push(data); // push each row
            console.log(data);

        })
        .on("end", function () {
            //console.log(fileRows);
            fs.unlinkSync(req.file.path);   // remove temp file

            const validationError = validateCsvData(fileRows);
            if (validationError) {
                return res.status(403).json({ error: validationError });
            }

            const peopleListToPush = [];
            fileRows.slice(1, fileRows.length).forEach((row) => {
                let currPerson = new Person({
                    name: row[0],
                    dob: row[1]
                });
                peopleListToPush.push(currPerson);
            });

            User.findOne({ email: req.currentUser._email }).then((currUser) => {
                let peopleList = currUser.peopleList;
                let newPeopleList = peopleList.concat(peopleListToPush);
                User.updateOne({ email: req.currentUser._email }, { $set: { peopleList: newPeopleList } }).then(() => {
                    res.json({ succes: true, msg: "Added people", data: newPeopleList });
                })
            });

        }).on('error', (error) => {
            fs.unlinkSync(req.file.path);   // remove temp file
            console.log(error.toString());
            return res.status(500).json({ success: false, msg: error.toString() });

        })




});

//Testing fcm
router.post('/sendFCM', verifyApiKey, verifyUserAuth, (req, res, next) => {
    let fcmToken="";
    const message = {
        data: { content: "Test fcm message from node" },
        notification: {
            title: "This is a Notification",
            body: "This is the body of the notification message."
        },
        token: fcmToken,

    };

    admin.messaging().send(message).then((response) => {
        // Response is a message ID string.
        console.log('Successfully sent message:', response);
        res.json({ success: true, msg: "Successfully sent messag" });
    })
        .catch((error) => {
            console.log('Error sending message:', error);
            res.status(400).json({ success: false, msg: error });
        });


});

//Set fcm deviceID
router.post('/updateDeviceId', verifyApiKey, verifyUserAuth, (req, res, next) => {
    if (!req.body.deviceId) {
        return res.status(400).json({ succes: false, msg: "No device id specified" });
    }

    User.findOne({ email: req.currUser._email }).then((currUser) => {
        let currDeviceIds = currUser.firebaseDeviceIds;
        currDeviceIds.push(req.body.deviceId);
        User.updateOne({ email: req.currUser._email }, { $set: { firebaseDeviceIds: currDeviceIds, isPushTurnedOn: true } }).then(() => {
            return res.json({ success: true, msg: "Device id added" });
        });
    });


});

//Get user info
router.get('/getUserInfo', verifyApiKey, verifyUserAuth, (req, res, next) => {


    User.findOne({ email: req.currentUser._email }).then((currUser) => {

        return res.json({
            name: currUser.username, 
            email: currUser.email, 
            profilePic: currUser.thumbnail, 
            telegram: currUser.channelId, 
            isTelegram: currUser.isTelegramTurnedOn, 
            isPush: currUser.isPushTurnedOn });
    });


});

router.post('/toggleTelegram', verifyApiKey, verifyUserAuth, (req, res, next) => {
    if (!req.body.turnOn) {
        return res.status(400).json({ succes: false, msg: "Parameter missing" });
    }

    User.findOne({ email: req.currentUser._email }).then((currUser) => {
        
        User.updateOne({ email: req.currentUser._email }, { $set: { isTelegramTurnedOn: req.body.turnOn } }).then(() => {
            return res.json({ success: true, msg: "Changed telegram settings" });
        });
    });


});
router.post('/togglePush', verifyApiKey, verifyUserAuth, (req, res, next) => {
    if (!req.body.turnOn) {
        return res.status(400).json({ succes: false, msg: "Parameter missing" });
    }

    User.findOne({ email: req.currentUser._email }).then((currUser) => {
        
        User.updateOne({ email: req.currentUser._email }, { $set: { isPushTurnedOn: req.body.turnOn } }).then(() => {
            return res.json({ success: true, msg: "Changed push notification settings" });
        });
    });


});

router.delete('/deleteAllPeople', verifyApiKey, verifyUserAuth, (req, res, next) => {
    
    User.updateOne({ email: req.currentUser._email }, { $set: { peopleList: [] } }).then(() => {
        return res.json({ success: true, msg: "Deleted all people" });
    });
    


});



module.exports = router;