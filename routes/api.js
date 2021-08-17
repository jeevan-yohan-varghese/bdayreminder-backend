const router = require('express').Router();
const verifyToken = require('../middlewares/verify-token');
const verifyUserAuth = require('../middlewares/verify-user-auth');

router.get('/', (req, res, next) => {

    res.send("Check documentation for endpoints");
});


//A sample route which requires authorization
router.get('/requireAuth', verifyToken, verifyUserAuth, (req, res, next)=>{
    res.send(`Welcome ${req.currentUser._name}`);
});

module.exports = router;