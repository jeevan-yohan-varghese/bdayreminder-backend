# Bday remineder Backend
REST Api for bday reminder app which will send notifications to your telegram channel on birthdays of people you have added.
## Features

- [x] User authentication
- [x] Person Endpoints
- [x] Telegram bot notification
- [x] Update telegram channel
- [x] Schedule notification
- [x] Upcoming birthdays
- [x] Todays birthdays
- [x] Upload CSV of people

## Install

`$ git clone https://github.com/jeevan-yohan-varghese/bdayreminder-backend.git`

`$ npm i`

`$ node index`

#### Note 
Make sure that you have the following **environment variables**

- API_KEY
- TOKEN_SECRET
- DB_CONNECTION_STRING
- FIREBASE_PROJECT_ID
- FIREBASE_PRIVATE_KEY
- FIREBASE_CLIENT_EMAIL
- BOT_TOKEN

Now the node app will be running on **localhost:5000** 