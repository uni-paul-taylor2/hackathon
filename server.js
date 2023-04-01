const cors = require('cors');
const express = require('express');
const app = express();

global.__basedir = __dirname;

let corsOptions = {
    origin: "http://localhost:8081"
};

app.use(cors(corsOptions));

const initRoutes = require("./routes");

app.use(express.urlencoded({ extended: true }));

initRoutes(app);

let port = process.env.PORT || 8080;
app.listen(port, () => {
    console.log(`Server is running on port ${port}.`);
});