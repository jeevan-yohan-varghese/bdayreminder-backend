const express = require('express');
const app = express();
const cron = require('node-cron');
const routes = require('./routes/api');
const authRoutes = require('./routes/auth-routes');
const axios=require('axios');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const cors = require('cors');
const User=require('./models/user-model');

//Connect to DB
mongoose.connect(process.env.DB_CONNECTION_STRING,
    { useNewUrlParser: true },
    () => console.log('Connected to db'));
    cron.schedule('00 22 01 * * *',  ()=> {
    /*
     * Runs every day
     * at 12:00:00 AM.
     */
    console.log("Cron triggered");
    User.find({},(err, users)=>{
        users.forEach((user)=>{
           
            let peopleList=user.peopleList;
            peopleList.forEach((person)=>{
                let cDob=new Date(person.dob);
                let today=new Date();
                if(cDob.getDate()===today.getDate()&& cDob.getMonth()===today.getMonth()){
                    console.log(`Happy Birthday ${person.name}`);
                    try {
                        let msg = `Happy Birthday ${person.name}`;
                        axios.get(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage?chat_id=@${user.channelId}&text=${msg}`).then(response => {
                            
                            console.log("Telegram message sent");
                            person.lastSentDate=today;
                            console.log(peopleList);
                            User.updateOne({ email: user.email }, { $set: { peopleList: peopleList } }).then(() => {

                                console.log(peopleList);
                                
                            });
                
                        }).catch(error => {
                            
                        });
                
                    } catch {
                        next();
                    }
                }
            })
        });
    })


}
);
//Middlewares
app.use(express.json());
app.use(cors());
app.use('/api', routes);
app.use('/auth', authRoutes);

app.use((err, req, res, next) => {
    res.status(422).send({ error: err.message });
})
app.listen(process.env.PORT || 5000, () => {
    console.log("now listening to requests");
    console.log(`${process.env.PORT || 5000}`);
});

