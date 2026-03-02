const express = require('express')
const app = express()
const notificationsRouter = require('./routes/notifications')

app.use('/api', notificationsRouter)

module.exports = app