const _get_Github_CSSEGISandData_COVID_19 = require('./_get_Github_CSSEGISandData_COVID_19');
const _get_Worldometers_Cases_COVID_19 = require('./_get_Worldometers_Cases_COVID_19');

exports.handler = (event, context, callback) => {
    //main data
    _get_Github_CSSEGISandData_COVID_19(() => {
        //support list
        _get_Worldometers_Cases_COVID_19();
    });
};