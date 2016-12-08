

import L from 'leaflet'
// import 'leaflet/dist/leaflet.css'


export default {
  name: 'basemap',
  mymap: null,
  props: {
    height: Number,
    stationConfig: {
      type: Object
    }
  },
  data () {
    return {
      mapBounds: {}
    }
  },
  mounted: function () {
    // setTimeout(() => {
    //   // emit the event and pass with it an object of "event data".
    //   this.$bus.$emit('specialEvent', {
    //     msg: 'This message came from the event.',
    //     alert: 'Alert! Alert! Alert!'
    //   });
    // }, 25000);
  },
  watch: {
    // whenever question changes, this function will run
    height: function (val, oldVal) {
      console.log('update height, new: %s, old: %s', val, oldVal)
      console.log('this height', this.height)
      document.getElementById('basemap').style.height = this.height + 'px'
    },
    stationConfig: function () {
      this.createBaseMap()
    }
  },
  methods: {
    createBaseMap () {
      var self = this
      this.mymap = L.map('basemap').setView([22.36, 114.12], 11.4)
      this.$bus.$emit('LmapEvent', this.mymap)
      L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpandmbXliNDBjZWd2M2x6bDk3c2ZtOTkifQ._QA7i5Mpkd_m30IGElHziw', {
        maxZoom: 18,
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
          '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
          'Imagery © <a href="http://mapbox.com">Mapbox</a>',
        id: 'mapbox.streets'
      }).addTo(this.mymap)

      var southWest = L.latLng(22.14671, 113.75587),
      northEast = L.latLng(22.60831, 114.49471),
      bounds = L.latLngBounds(southWest, northEast);
      this.mymap.setMaxBounds(bounds)

      for (let i = 0; i < this.stationConfig['Stations'].length; i++) {
        var marker = L.marker([parseFloat(this.stationConfig['Stations'][i]['latitude']), parseFloat(this.stationConfig['Stations'][i]['longitude'])]).addTo(this.mymap)
        marker.bindPopup('StationName: ' + this.stationConfig['Stations'][i]['StationName'] + '<br>' + 'Latitude: ' + this.stationConfig['Stations'][i]['latitude'] + '<br>' + 'Longitude: ' + this.stationConfig['Stations'][i]['longitude'])
        L.circle([parseFloat(this.stationConfig['Stations'][i]['latitude']), parseFloat(this.stationConfig['Stations'][i]['longitude'])], {
          color: 'red',
          fillColor: '#f03',
          fillOpacity: 0.5,
          radius: 500
        }).addTo(this.mymap)
      }

      var popup = L.popup()
      function onMapClick(e) {
        popup
          .setLatLng(e.latlng)
          .setContent('You clicked the map at ' + e.latlng.toString())
          .openOn(self.mymap)
      }
      this.mymap.on('click', onMapClick)
      console.log('getBounds', this.mymap.getBounds())
      this.$bus.$emit('mapBoundsEvent', this.mymap.getBounds())
      this.mymap.on('moveend', () => {
        this.$bus.$emit('mapBoundsEvent', this.mymap.getBounds())
      })
    }
  }
}
