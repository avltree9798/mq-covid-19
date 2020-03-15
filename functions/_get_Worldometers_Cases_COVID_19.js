const request = require('request');
const $ = require("cheerio");
const AWS = require('aws-sdk');
const moment = require('moment');

let parseData = (elm) => {

    let tds = $(elm).find('td');

    let countryName = tds.eq(0).text().trim();
    let totalCases = tds.eq(1).text();
    let totalDeaths = tds.eq(3).text();
    let totalRecovered = tds.eq(5).text();

    return {
        name: countryName,
        confirmed: parseInt(totalCases) || 0,
        deaths: parseInt(totalDeaths) || 0,
        recovered: parseInt(totalRecovered) || 0,
    }

};

let doMappingData = (finalData) => {

    let finalDataObject = {};
    finalData.forEach(x => {
        finalDataObject[x.name] = x;
    });

    let s3 = new AWS.S3();
    let currDate = moment().format("YYYY-MM-DD") + 'T00:00:00.000Z';

    s3.getObject({
        Bucket: process.env.BUCKET_NAME,
        Key: 'api/data.json'
    }, (err, data) => {

        let parsedData = JSON.parse(data.Body);
        let latestData = null;

        parsedData.items.forEach(x => {
            latestData = x.date
        });

        let selectedKey = null;
        let currKeyObject = currDate.split('T')[0];

        if (currDate !== latestData) {
            // create new data with currDate
            selectedKey = (latestData + '').split('T')[0];
            parsedData.items.push({
                date: currDate,
                name: "Data for " + selectedKey + " GMT",
                detail: "api/data/" + selectedKey + ".json",
                file_name: "-",
                updated_at: moment(),
            });
        } else {
            selectedKey = currDate.split('T')[0];
            parsedData.items[parsedData.items.length - 1].updated_at = moment();
        }

        s3.getObject({
            Bucket: process.env.BUCKET_NAME,
            Key: 'api/data/' + selectedKey + '.json'
        }, (errGetLatest, dataGetLatest) => {
            let latestData = JSON.parse(dataGetLatest.Body);
            let isDataUpdated = null;

            latestData.items.forEach(i => {

                let dataExists = null;

                if (finalDataObject[i.province_state]) dataExists = finalDataObject[i.province_state];
                if (finalDataObject[i.country_region]) dataExists = finalDataObject[i.country_region];

                if (dataExists && dataExists.confirmed > i.confirmed) {
                    i.confirmed = dataExists.confirmed;
                    i.deaths = dataExists.deaths;
                    i.recovered = dataExists.recovered;
                    isDataUpdated = true;
                }

            });

            if (isDataUpdated) {
                latestData.updated_at = moment();
                latestData.scraped_at = moment();
                s3.putObject({
                    ACL: "public-read",
                    Bucket: process.env.BUCKET_NAME,
                    Key: 'api/data/' + currKeyObject + '.json',
                    Body: JSON.stringify(latestData),
                    ContentType: "application/json"
                }, function (err, data) {
                    if (err) {
                        console.log(err);
                    }
                });
            }

        });

        parsedData.scraped_at = moment();

        s3.putObject({
            ACL: "public-read",
            Bucket: process.env.BUCKET_NAME,
            Key: 'api/data.json',
            Body: JSON.stringify(parsedData),
            ContentType: "application/json"
        }, function (err, data) {
            if (err) {
                console.log(err);
            }
        });

    });

};

module.exports = () => {
    request('https://www.worldometers.info/coronavirus/', {}, (err, res, body) => {
        let finalData = [];
        $("#main_table_countries tr", body).each((idx, elm) => {
            let parsedData = parseData(elm);
            finalData.push(parsedData);
        });
        doMappingData(finalData);
    });
};