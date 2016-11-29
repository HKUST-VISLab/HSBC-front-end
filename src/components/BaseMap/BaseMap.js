import L from 'leaflet'

export default {
  name: 'basemap',
  props: {
    height: Number,
    stationConfig: {
      type: Object
    }
  },
  mounted: function () {
    this.$nextTick(function () {
    })
  },
  watch: {
    // whenever question changes, this function will run
    height: function () {
      document.getElementById('basemap').style.height = this.height + 'px'
    },
    stationConfig: function () {
      this.createBaseMap()
    }
  },
  methods: {
    createBaseMap () {
      var mymap = L.map('basemap').setView([22.36, 114.12], 11.4)
      L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpandmbXliNDBjZWd2M2x6bDk3c2ZtOTkifQ._QA7i5Mpkd_m30IGElHziw', {
        maxZoom: 18,
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
          '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
          'Imagery © <a href="http://mapbox.com">Mapbox</a>',
        id: 'mapbox.streets'
      }).addTo(mymap)

      for (let i = 0; i < this.stationConfig['Stations'].length; i++) {
        var marker = L.marker([parseFloat(this.stationConfig['Stations'][i]['latitude']), parseFloat(this.stationConfig['Stations'][i]['longitude'])]).addTo(mymap)
        marker.bindPopup('StationName: ' + this.stationConfig['Stations'][i]['StationName'] + '<br>' + 'Latitude: ' + this.stationConfig['Stations'][i]['latitude'] + '<br>' + 'Longitude: ' + this.stationConfig['Stations'][i]['longitude'])
        L.circle([parseFloat(this.stationConfig['Stations'][i]['latitude']), parseFloat(this.stationConfig['Stations'][i]['longitude'])], {
          color: 'red',
          fillColor: '#f03',
          fillOpacity: 0.5,
          radius: 500
        }).addTo(mymap)
      }
    }
  }
}