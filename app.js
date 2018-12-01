const http = require('http');
const xpath = require('xpath');
const parse5 = require('parse5');
const xmlser = require('xmlserializer');
const dom = require('xmldom').DOMParser;
const fs = require('fs');

const options = {
};

var p = 1;
var pageMax = 10;
var jsonResults = [];

function getPage(page) {
    let data = "";
    options['host'] = `www.chucknorrisfacts.fr`;
    options['path'] = `/facts?p=${page}`;
    http.get(options, (res) => {
        res.on("data", function (chunk) {
            data += chunk;
        });

        res.on("end", function () {
            let nodesFactBody = getFromXpath(data, '//x:div[@class="factbody"]');
            let wStream = fs.createWriteStream(`./test/${page}.json`);
            nodesFactBody.forEach(nodeFactBody => {
                wStream.write(nodeFactBody.toString());
                let nodeNote = getFromXpath(nodeFactBody.toString(), '//x:div[@class="raty"]/@data-score');
                let nodeText = getFromXpath(nodeFactBody.toString(), '//text()');

                if (nodeText[0] && nodeNote[0]) {
                    jsonResults.push({
                        text: nodeText[0].toString().trim(),
                        note: cleanNote(nodeNote[0].toString())
                    });
                }
            });
            wStream.end();
            if (p <= pageMax) {
                p++;
                setTimeout(
                    () => {
                        getPage(p);
                    }
                , 1000);
            }
            else {
                saveJson(jsonResults);
            }
        });
    });
}

function getFromXpath(data, xpath_) {
    var document = parse5.parse(data);
    const xhtml = xmlser.serializeToString(document);
    var doc = new dom().parseFromString(xhtml);
    const select = xpath.useNamespaces({ "x": "http://www.w3.org/1999/xhtml" });
    const nodes = select(`${xpath_}`, doc);
    return nodes;
}

function cleanNote(str) {
    var regex = /data-score="(.*?)"/gi;
    var note = regex.exec(str);
    if(note[1]) return note[1];
    else return 5;
}

function saveJson(json) {
    fs.writeFile('chucknorrisfacts.json', JSON.stringify(json), 'utf8', () => {
        process.exit();
    });
}

// On lance
getPage(1);