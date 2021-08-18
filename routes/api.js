const router = require('express').Router();
const verifyApiKey = require('../middlewares/verify-apikey');
const verifyUserAuth = require('../middlewares/verify-user-auth');
const User = require('../models/user-model');
const Person = require('../models/person-model');
router.get('/', (req, res, next) => {

    res.send("Check documentation for endpoints");
});


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
        let originalLen=currentPeopleList.length;
        for (let i = 0; i < currentPeopleList.length; i++) {
            console.log(typeof currentPeopleList[i]._id.toString());
            if (currentPeopleList[i]._id.toString() === req.body.personId) {
                console.log("Found person");
                currentPeopleList.splice(i, 1);
               
            }
        }
        if(originalLen===currentPeopleList.length){
            return res.json({success:false,msg:"Could not find id"});
        }
        User.updateOne({ email: currentUser.email }, { $set: { peopleList: currentPeopleList } }).then(() => {
            
            console.log(peopleList);
            return res.json({ succes: true, msg: "Person Deleted" ,data: currentPeopleList})
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
                currentPeopleList[i].name=req.body.name;
                currentPeopleList[i].dob=req.body.dob;
                
               
            }
        }
        
        User.updateOne({ email: currentUser.email }, { $set: { peopleList: currentPeopleList } }).then(() => {
            
            console.log(currentPeopleList);
            return res.json({ succes: true, msg: "Person Updated" ,data: currentPeopleList})
        });
        
        
    });
});
module.exports = router;