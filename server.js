'use strict';

require('dotenv').config();

const express = require('express');
const app = express();

app.use(express.json());

// AI pronunciation analysis route
app.use('/api/ai', require('./routes/ai'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`CourseFlow server running on port ${PORT}`);
});

module.exports = app;
