const uploadFile = require("../middleware/upload");
const fs = require("fs");
const baseUrl = "http://localhost:8080/files/";

const pdfParse = require('pdf-parse');

const upload = async (req, res) => {
    try {
        await uploadFile(req, res);
        if (req.file == undefined) {
            return res.status(400).send({ message: "Please upload a file!" });
        }

        const filePath = __basedir + "/assets/uploads/" + req.file.filename;
        const outputPath = __basedir + "/assets/uploads/" + req.file.originalname.replace(".pdf", "") + ".txt";

        // Extract content from PDF
        const data = await fs.promises.readFile(filePath);
        const pdf = await pdfParse(data);
        const contents = pdf.text.split(/(?:\r\n|\r|\n){2}/g);

        // Save course content to a text file
        await fs.promises.writeFile(outputPath, contents.join('\n\n'));

        res.status(200).send({
            message: "Uploaded the file successfully: " + req.file.originalname
        });
    } catch (err) {
        console.log(err);
        if (err.code == "LIMIT_FILE_SIZE") {
            return res.status(500).send({
                message: "File size cannot be larger than 2MB!"
            });
        }
        res.status(500).send({
            message: `Could not upload the file: ${req.file.originalname}. ${err}`
        });
    }
}

const getListFiles = (req, res) => {
    const directoryPath = __basedir + "/assets/uploads/";
    fs.readdir(directoryPath, function (err, files) {
        if (err) {
            res.status(500).send({
                message: "Unable to scan files!",
            });
        }
        let fileInfos = [];

        files.forEach((file) => {
            fileInfos.push({
                name: file,
                url: baseUrl + file,
            });
        });

        res.status(200).send(fileInfos);
    });
};

const download = (req, res) => {
    const fileName = req.params.name;
    const directoryPath = __basedir + "/assets/uploads/";

    res.download(directoryPath + fileName, fileName, (err) => {
        if (err) {
            res.status(500).send({
                message: "Could not download the file. " + err,
            });
        }
    });
};

module.exports = {
    upload,
    getListFiles,
    download,
};