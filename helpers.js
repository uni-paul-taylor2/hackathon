const fs = require('fs')

function getJson(name) {
    if (fs.existsSync(name)) {
        try {
            let rawdata = fs.readFileSync(name);
            let json = JSON.parse(rawdata);


            return json;
        } catch {
            return {};
        }
    }
    else {
        setJson(name, {});
        return {};
    }
}

function setJson(name, json) {
    try {
        let data = JSON.stringify(json);
        fs.writeFileSync(name, data);
    } catch { }
}

function sleep(ms) {
    return new Promise(res => setTimeout(res, ms));
}

function getParameterCaseInsensitive(obj, key) {
    const asLowercase = key.toLowerCase();
    return obj[Object.keys(obj)
        .find(k => k.toLowerCase() === asLowercase)
    ];
}

module.exports = {
    getJson,
    setJson,
    sleep,
    getParameterCaseInsensitive
}