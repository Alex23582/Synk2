const { Pool } = require('pg')
const fs = require('fs')
const express = require('express')
require('dotenv').config()
const app = express()


let overrideip = null

const teamspeakRequestQueue = 'teamspeak_auth_request';





app.get('/', (req, res) => {
    res.send('Hello World!')
})



