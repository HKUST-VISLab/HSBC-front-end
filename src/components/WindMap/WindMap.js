import * as d3 from 'd3'
import vfsolver from '../../lib/vfsolver.js'
import netservice from '../../service/netservice.js'

export default {
  name: 'windmap',
  timer: null,
  props: {
    height: Number,
    width: Number,
    stationLocation: Object
  },
  data () {
    return {
      vectorField: {},
      canvasID: '#windmap',
      windInfo: [],
      windConstraint: [],
      mapBounds:{topLeft: [0, 0], bottomRight: [0, 0]},
      Lmap: null,
      samplePointNum: 50
    }
  },
  watch: {
    // whenever question changes, this function will run
    height: function () {
      document.getElementById('windmap').height = this.height
      // this.createWindMap(this.height, this.width, this.windConstraint, this.canvasID)
    },
    width: function () {
      document.getElementById('windmap').width = this.width
      // this.drawVectorField(this.height, this.width, this.vectorField, this.canvasID)
      // this.createWindMap(this.height, this.width, this.windConstraint, this.canvasID)
    },
    windInfo: function () {
      console.log('windInfo')
      if (Object.keys(this.stationLocation).length === 0) return 
      this.updateWindConstraint()
    },
    windConstraint: function () {
      this.createWindMap(this.height, this.width, this.windConstraint, this.canvasID)
    }
  },
  mounted: function () {
    this.$nextTick(function () {
      this.getWindInfo()
      
      this.$bus.$on('specialEvent', event => {
        alert(event.alert);
        console.log(event);
      });
      this.$bus.$on('LmapEvent', event => {
        this.Lmap = event
        console.log('this.Lmap: ', this.Lmap)
        console.log('distance: ', this.Lmap.distance([1,2], [3, 4]))
      })
      this.$bus.$on('mapBoundsEvent', event => {
        this.mapBounds.topLeft = [event._northEast.lat, event._southWest.lng]
        this.mapBounds.bottomRight = [event._southWest.lat, event._northEast.lng]
        console.log('mapBounds: ', this.mapBounds);
        this.updateWindConstraint()
      })

      // setInterval(() => {
      //   this.getWindInfo()
      // }, 10000)
    })
  },
  methods: {
    getWindInfo () {
      netservice.getWindInfo(responseData => {
        if (responseData.status === 200) {
          var tempData = JSON.parse(responseData.data)
          var tempWindInfo = []
          console.log('tempData length', tempData['records'].length)
          for(var i=0; i<tempData['records'].length; i++){
            if(tempData['records'][i]['has_wind']) {
              var tempItem = {
                'stn': tempData['records'][i]['stn'].toLowerCase(),
                'winddirection': parseFloat(tempData['records'][i]['winddirection']),
                'windspeed': parseFloat(tempData['records'][i]['windspeed'])
              }
              tempWindInfo.push(tempItem)
            }
          }
          this.windInfo = tempWindInfo
        }
      })
    },
    getMapBounds () {
    },
    updateWindConstraint () {
      // console.log('this.xScale', d3.scaleLinear())
      // console.log('width: ', this.Lmap.distance(this.mapBounds.topLeft, [this.mapBounds.topLeft[0], this.mapBounds.bottomRight[1]]))
      // console.log('height: ', this.Lmap.distance(this.mapBounds.topLeft, [this.mapBounds.bottomRight[0], this.mapBounds.topLeft[1]]))
      var xScale = d3.scaleLinear().domain([0, this.Lmap.distance(this.mapBounds.topLeft, [this.mapBounds.topLeft[0], this.mapBounds.bottomRight[1]])]).range([0, this.width])
      var yScale = d3.scaleLinear().domain([0, this.Lmap.distance(this.mapBounds.topLeft, [this.mapBounds.bottomRight[0], this.mapBounds.topLeft[1]])]).range([0, this.height])
      // judge the range  and transform the data
      var tempWindConstraint = []
      for(var i=0; i<this.windInfo.length; i++){
        if (this.stationLocation[this.windInfo[i].stn][0] < this.mapBounds.bottomRight[0]) continue
        if (this.stationLocation[this.windInfo[i].stn][0] > this.mapBounds.topLeft[0]) continue
        if (this.stationLocation[this.windInfo[i].stn][1] < this.mapBounds.topLeft[1]) continue
        if (this.stationLocation[this.windInfo[i].stn][1] > this.mapBounds.bottomRight[1]) continue
        // console.log(i, this.stationLocation[this.windInfo[i].stn])

        var tempItem = {
          x: xScale(this.Lmap.distance(this.mapBounds.topLeft, [this.mapBounds.topLeft[0], this.stationLocation[this.windInfo[i].stn][1]])),
          y: yScale(this.Lmap.distance(this.mapBounds.topLeft, [this.stationLocation[this.windInfo[i].stn][0], this.mapBounds.topLeft[1]])),
          vx: this.windInfo[i].windspeed * Math.sin(this.windInfo[i].winddirection * Math.PI/180),
          vy: - this.windInfo[i].windspeed * Math.cos(this.windInfo[i].winddirection * Math.PI/180),
        }
        tempWindConstraint.push(tempItem)
      }
      this.windConstraint = tempWindConstraint
    },
    createWindMap (height, width, windConstraint, canvasID) {
      var vectorField = this.genVectorField(height, width, windConstraint)
      this.vectorField = vectorField
      this.drawVectorField(height, width, vectorField, canvasID)
    },
    genVectorField (height, width, windConstraint) {
      if(windConstraint.length === 0){
        // alert("No constraint!");
        return {};
      }
      // console.log("constraint:", windConstraint.length);

      var vfW = this.samplePointNum, vfH = this.samplePointNum;
      var vectorField = vfsolver.createField({
        width: vfW,
        height: vfH,
        constraints: windConstraint,
        domainX: d3.scaleLinear().domain([0, width]),
        domainY: d3.scaleLinear().domain([0, height])
      })
      // console.log("field: ", vectorField)
      return vectorField
    },
    drawVectorField (height, width, vectorField, canvasID) {
      if(Object.keys(vectorField).length === 0){
        return null;
      }
      if(this.timer) {clearInterval(this.timer); }
      d3.select(canvasID).node().getContext("2d").clearRect(0, 0, d3.select(canvasID).node().width, d3.select(canvasID).node().height);
      let self = this
      var step_h = 0.1, iter_nums = 400;
      // vector field data
      var gamma = 2, c = 10, dt = 0.005,
        X0 = [], Y0 = [], // to store initial starting locations
        X = [], Y = [], // to store current point for each curve
        xb = 1.5, yb = 1.3;
      //// curve ////
      var N = this.samplePointNum, // 25^2 curves
        // discretize the vfield coords
        xp = d3.range(N),
        yp = d3.range(N);

      //// mapping from vfield coords to web page coords
      // var width = this.width,
      //     height = this.height;
      var xMap = d3.scaleLinear()
          .domain([0, N])
          .range([0, width]),
        yMap = d3.scaleLinear()
          .domain([0, N])
          .range([0, height]);

      // console.log('xp:', xp);
      // console.log('yp:', yp);
      // array of starting positions for each curve on a uniform grid
      for (var i = 0; i < N; i++) {
        for (var j = 0; j < N; j++) {
          var velocity = self.vectorField.eval(xMap(xp[j]), yMap(yp[i]))
          if (velocity[0]*velocity[0]+velocity[1]*velocity[1] < 8) continue
          // if (self.vectorField.eval(X[i], Y[i]) < 1) continue
          // console.log('vectorField.eval: ', self.vectorField.eval(X[i], Y[i]))
          X.push(xMap(xp[j])), Y.push(yMap(yp[i]));
          X0.push(xMap(xp[j])), Y0.push(yMap(yp[i]));
        }
      }
      // console.log('X:', X);
      // console.log('Y:', Y);
      var mw = 0, // if we want a margin
        ctx = d3.select(canvasID).node().getContext("2d"); // initialize a "canvas" element
      ctx.fillStyle = "rgba(0, 0, 0, 0.05)"; // for fading curves
      ctx.lineWidth = 0.7;
      ctx.strokeStyle = "#FF8000"; // html color code
      //// animation setup
      var animAge = 0,
        frameRate = 50, // ms per timestep (yeah I know it's not really a rate)
        M = X.length,
        MaxAge = 100, // # timesteps before restart
        age = [];
      for (var i=0; i<M; i++) {age.push(randage());}
      var drawFlag = true;
      // setInterval(function () {if (drawFlag) {draw();}}, frameRate);
      this.timer = setInterval(function () {if (drawFlag) {draw();}}, frameRate);
      d3.select(canvasID)
        .on("click", function() {drawFlag = (drawFlag) ? false : true;});
      function randage() {
        // to randomize starting ages for each curve
        return Math.round(Math.random()*100);
      }
      // for info on the global canvas operations see
      // http://bucephalus.org/text/CanvasHandbook/CanvasHandbook.html#globalcompositeoperation
      ctx.globalCompositeOperation = "source-over";
      function draw() {
        ctx.fillRect(0, 0, width, height); // fades all existing curves by a set amount determined by fillStyle (above), which sets opacity using rgba
        for (var i=0; i<M; i++) { // draw a single timestep for every curve
          var nextPos = self.generateNextPos([X[i], Y[i]], step_h);
          ctx.beginPath();
          ctx.moveTo(X[i], Y[i]); // the start point of the path
          ctx.lineTo(nextPos[0], nextPos[1]); // the end point
          ctx.stroke(); // final draw command
          X[i] = nextPos[0];
          Y[i] = nextPos[1];
          if (age[i]++ > MaxAge) {
            // incriment age of each curve, restart if MaxAge is reached
            age[i] = randage();
            X[i] = X0[i], Y[i] = Y0[i];
          }
        }
      }
    },
    generateNextPos (_cur_pos, _step_h) {
      var final_pos = [];
      var hh = _step_h * 0.5, h6 = _step_h / 6.0;
      var h = _step_h;
      var getVelocity = this.vectorField.eval;

      var s1 = getVelocity(_cur_pos[0],_cur_pos[1]);
      var s2 = getVelocity( _cur_pos[0] + hh*s1[0], _cur_pos[1] + hh*s1[1]);
      var s3 = getVelocity(_cur_pos[0] + hh*s2[0], _cur_pos[1] + hh*s2[1]);
      var s4 = getVelocity(_cur_pos[0] + h*s3[0],_cur_pos[1] + h*s3[0]);

      var final_pos_x = _cur_pos[0] + h6*(s1[0] + 2*s1[0] + 2*s3[0] +s4[0]);
      var final_pos_y = _cur_pos[1] + h6*(s1[1] + 2*s1[1] + 2*s3[1] +s4[1]);

      //check whether it exceeds the limits
      var width = this.width, height = this.height;//attention! magic number, remember to change it later
      final_pos_x = final_pos_x > width ? width : final_pos_x;
      final_pos_x = final_pos_x < 0 ? 0 : final_pos_x;
      final_pos_y = final_pos_y > height ? height : final_pos_y;
      final_pos_y = final_pos_y < 0 ? 0 : final_pos_y;

      final_pos.push(final_pos_x);
      final_pos.push(final_pos_y);
      return final_pos;
    },
  }
}
