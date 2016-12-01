<template>
  <div id="app">
    <nav class="navbar navbar-inverse navbar-fixed-top">
      <div class="container">
        <div class="navbar-header">
          <button type="button" class="navbar-toggle collapsed" data-toggle="collapse" data-target="#navbar" aria-expanded="false"
                  aria-controls="navbar">
            <span class="sr-only">Toggle navigation</span>
            <span class="icon-bar"></span>
            <span class="icon-bar"></span>
            <span class="icon-bar"></span>
          </button>
          <a class="navbar-brand" href="#">HSBC Project</a>
        </div>
        <div id="navbar" class="collapse navbar-collapse">
          <ul class="nav navbar-nav">
            <li class="active"><a href="#">Home</a></li>
            <li><a href="#about">About</a></li>
            <li><a href="#contact">Contact</a></li>
          </ul>
        </div>
        <!--/.nav-collapse -->
      </div>
    </nav>
    <div id="main">
      <base-map :height="height" :station-config="stationConfig"></base-map>
      <wind-map :height="height" :width="width" :windConstraint="windConstraint"></wind-map>
      <!--<hello></hello>-->
    </div>
  </div>
</template>cd

<script>
// css
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap/dist/css/bootstrap-theme.min.css';

// js
import BaseMap from './components/BaseMap/BaseMap.vue';
import WindMap from './components/WindMap/WindMap.vue';
import netservice from './service/netservice.js';

const ROOTPATH = '/'

export default {
  name: 'app',
  data () {
    return {
      rawDataPath: ROOTPATH + 'static/data/',
      margin: { 'top': 0, 'right': 0, 'bottom': 0, 'left': 0 },
      height: 0,
      width: 0,
      stationConfig: {},
      windConstraint: []
    }
  },
  mounted: function () {
    this.$nextTick(function () {
      this.initVariables()
      console.log('Run request here!')
      this.getStationConfig()
      this.getWindConstraint()
    })
  },
  methods: {
    initVariables () {
      this.height = window.innerHeight - document.querySelector('.navbar').clientHeight
      this.width = window.innerWidth
      document.getElementById('main').style.height = this.height + 'px'

      // d3.json(this.rawDataPath + 'full_station_config.json', (err, data) => {
      //   if (err) throw err
      //   this.stationConfig = data
      // })

      // d3.json(this.rawDataPath + 'all_constraints_2.json', (err, data) => {
      //   if (err) throw err
      //   this.windConstraint = data
      // })
    },
    getStationConfig () {
      netservice.getStationConfig(responseData => {
        if (responseData.status === 200) {
          this.stationConfig = JSON.parse(responseData.data)
        }
      })
    },
    getWindConstraint () {
      netservice.getWindConstraint(responseData => {
        if (responseData.status === 200) {
          this.windConstraint = JSON.parse(responseData.data)
        }
      })
    }
    // getWeatherData () {
    //   $getWeatherData(responseData => {
    //     if (responseData.status === 200) {
    //       console.log(responseData.data)
    //       console.log(JSON.parse(responseData.data))
    //     }
    //   })
    // }
  },
  components: {
    BaseMap,
    WindMap
  }
}
</script>

<style>
  #app {
    font-family: 'Avenir', Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-align: center;
    color: #2c3e50;
    margin-top: 50px;
  }

  .navbar {
    border: 0px;
    margin: 0px;
  }
</style>
