const router = require('express').Router();
const verifyApiKey = require('../middlewares/verify-apikey');
const verifyUserAuth = require('../middlewares/verify-user-auth');

router.get('/', (req, res, next) => {

    res.send("Check documentation for endpoints");
});


//A sample route which requires authorization
router.get('/requireAuth', verifyApiKey, verifyUserAuth, (req, res, next)=>{
    res.send(`Welcome ${req.currentUser._name}`);
});

module.exports = router;