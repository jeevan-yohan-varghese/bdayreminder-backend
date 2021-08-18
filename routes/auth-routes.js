const router = require('express').Router()
const admin = require('firebase-admin')
const jwt = require('jsonwebtoken')
const verifyApiKey = require('../middlewares/verify-apikey');
const serviceAccount = require("../serviceAccountKey.json");

const User=require('../models/user-model');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

router.post('/login', verifyApiKey, (req, res, next) => {
    admin.auth().verifyIdToken(req.body.authtoken)
        .then((decodedToken) => {
            console.log(decodedToken.email);
           

            
            User.findOne({email:decodedToken.email}).then((currentUser)=>{
                if(!currentUser){
                    //User does not exist. Creating new user
                    console.log("Creating new user");
                    new User({
                        username: decodedToken.name,
                        email: decodedToken.email,
                        thumbnail: decodedToken.picture
                    }).save().then((newUser)=>{
                        console.log("New user created");
                        const token = jwt.sign({_email:newUser.email,_name:newUser.username}, process.env.TOKEN_SECRET);
                        return res.status(200).json({
                            success: true,
                            authToken: token
                          })
                    });
                }else{
                    //User already exists
                    console.log("User exists");
                    const token = jwt.sign({_email:currentUser.email,_name:currentUser.username}, process.env.TOKEN_SECRET);
                    return res.status(200).json({
                        success: true,
                        authToken: token
                      })
    
                }
            });
            
            
        }).catch((err) => {
            console.log(err);
            return res.status(403).send('Unauthorized')
        });

});



module.exports = router