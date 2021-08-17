const router = require('express').Router()
const admin = require('firebase-admin')
const jwt = require('jsonwebtoken')
const verifyApiKey = require('../middlewares/verify-apikey');
const serviceAccount = require("../serviceAccountKey.json");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

router.post('/login', verifyApiKey, (req, res, next) => {
    admin.auth().verifyIdToken(req.body.authtoken)
        .then((decodedToken) => {
            console.log(decodedToken.email);
           

            const token = jwt.sign({_email:decodedToken.email,_name:decodedToken.name}, process.env.TOKEN_SECRET);

            return res.status(200).json({
              success: true,
              authToken: token
            })
        }).catch((err) => {
            console.log(err);
            return res.status(403).send('Unauthorized')
        });

});



module.exports = router