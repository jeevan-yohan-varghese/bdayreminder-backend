const express = require('express');
const app = express();

const routes = require('./routes/api');
const authRoutes = require('./routes/auth-routes');

const mongoose=require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const cors = require('cors');

//Connect to DB
mongoose.connect(process.env.DB_CONNECTION_STRING,
    { useNewUrlParser: true },
    () => console.log('Connected to db'));

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

