const cors = require('cors');
const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

global.__basedir = __dirname;

let corsOptions = {
    origin: "http://localhost:8081"
};

app.use(cors(corsOptions));

const initRoutes = require("./routes");

app.use(express.urlencoded({ extended: true }));

// Create assets and uploads directories if they don't exist
const assetsDir = path.join(__dirname, 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir);
}
const uploadsDir = path.join(assetsDir, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

initRoutes(app);

let port = process.env.PORT || 8080;
app.listen(port, () => {
    console.log(`Server is running on port ${port}.`);
});