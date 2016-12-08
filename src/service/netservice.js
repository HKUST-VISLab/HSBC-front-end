import Vue from 'vue'
import VueResource from 'vue-resource'
Vue.use(VueResource)

// Test version
const devMainUrl = 'http://127.0.0.1:5000'


const $http = Vue.http

function getWeatherData (callback) {
  console.log('run here');
  const url = `${devMainUrl}/getWeatherData`
  $http.get(url).then(response => {
    callback(response)
  }, errResponse => {
    console.log(errResponse)
  })
}

function getStationConfig (callback) {
  console.log('run here station');
  const url = `${devMainUrl}/stationConfig`
  $http.get(url).then(response => {
    callback(response)
  }, errResponse => {
    console.log(errResponse)
  })
}

function getWindConstraint (callback) {
  console.log('run here constraint');
  const url = `${devMainUrl}/windConstraint`
  $http.get(url).then(response => {
    callback(response)
  }, errResponse => {
    console.log(errResponse)
  })
}

function getWindInfo (callback) {
  console.log('run here windinfo');
  const url = `${devMainUrl}/windInfo`
  $http.get(url).then(response => {
    callback(response)
  }, errResponse => {
    console.log(errResponse)
  })
}
// function getImages(imageFolder, imageNum, callback) {
//     const url = `${devMainUrl}/${imageFolder}/${imageNum}`;
//     $http.get(url).then(response => {
//         callback(response);
//     }, errResponse => {
//         console.log(errResponse);
//     });
// }

// function updateImgCombination(imgCollectionList, callback) {
//     const url = `${devMainUrl}/updateImgCombination`;
//     $http.post(url, { imgList: imgCollectionList }, {
//         header: {
//             'Content-Type': 'application/json',
//         },
//     }).then(response => {
//         callback(response);
//     }, errResponse => {
//         console.log(errResponse);
//     });
// }

// function updateTemplateIndex(templateIndex, callback) {
//     const url = `${devMainUrl}/updateTemplateIndex`;
//     $http.post(url, { index: templateIndex }, {
//         header: {
//             'Content-Type': 'application/json',
//         },
//     }).then(response => {
//         callback(response);
//     }, errResponse => {
//         console.log(errResponse);
//     });
// }

export default {
  getWeatherData,
  getStationConfig,
  getWindConstraint,
  getWindInfo
}
