const request = require('request');
const $ = require("cheerio");
const moment = require("moment");
const AWS = require('aws-sdk');
const csv = require('csvtojson');

AWS.config.update({region: 'ap-southeast-1'});

let _getDetail = (url) => {
    return new Promise((resolve, reject) => {
        let tempDetailData = [];
        csv().fromStream(request.get(url)).subscribe((json) => {
            return new Promise((resolve, reject) => {
                tempDetailData.push(json);
                resolve();
            })
        }).then(() => {
            let cleanData = [];
            tempDetailData.forEach(x => {
                cleanData.push({
                    province_state: x['Province/State'],
                    country_region: x['Country/Region'],
                    confirmed: parseInt(x['Confirmed']),
                    deaths: parseInt(x['Deaths']),
                    recovered: parseInt(x['Recovered'])
                });
            });
            resolve({
                items: cleanData,
                scraped_at: moment()
            });
        });
    });
};

let _getIndex = () => {

    const indexURL = 'https://github.com/CSSEGISandData/COVID-19/tree/master/csse_covid_19_data/csse_covid_19_daily_reports';

    let parseData = (elm) => {

        let fileName = $(elm).find('td').eq(1).find('a').html();
        let fileUpdated = $(elm).find('td').eq(3).find('[datetime]').attr('datetime');

        if (fileName.indexOf('.csv') < 0) return false;

        let dateData = fileName.split('.')[0].split('-');
        let dateClean = dateData[2] + '-' + dateData[0] + '-' + dateData[1];

        return {
            date: moment(dateClean),
            name: 'Data for ' + dateClean + ' GMT',
            detail: 'api/data/' + dateClean + '.json',
            file_name: fileName,
            updated_at: moment(fileUpdated)
        };

    };

    return new Promise((resolve, reject) => {

        request(indexURL, {
            json: false
        }, (err, res, body) => {

            let indexData = [];

            $(".repository-content table.files tr.js-navigation-item", body).each((idx, elm) => {
                let parsedData = parseData(elm);
                if (parsedData) indexData.push(parsedData);
            });

            resolve({
                items: indexData,
                scraped_at: moment()
            });

        });

    });

};


module.exports = (callback) => {
    console.log("Start: _get_Github_CSSEGISandData_COVID_19");
    _getIndex().then((indexData) => {
        let s3 = new AWS.S3();
        indexData.items.forEach(idx => {
            let detailURL = "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_daily_reports/" + idx.file_name;
            _getDetail(detailURL).then((result) => {
                result.updated_at = idx.updated_at;
                console.log("Start: _get_Github_CSSEGISandData_COVID_19 => " + idx.detail);
                s3.putObject({
                    ACL: "public-read",
                    Bucket: process.env.BUCKET_NAME,
                    Key: idx.detail,
                    Body: JSON.stringify(result),
                    ContentType: "application/json"
                }, function (err, data) {
                    if (err) {
                        console.log(err);
                    }
                });
            });
        });
        console.log("Start: _get_Github_CSSEGISandData_COVID_19 => api/data.json");
        s3.putObject({
            ACL: "public-read",
            Bucket: process.env.BUCKET_NAME,
            Key: 'api/data.json',
            Body: JSON.stringify(indexData),
            ContentType: "application/json"
        }, function (err, data) {
            if (err) {
                console.log(err);
            }
            callback();
        });
    });
};
