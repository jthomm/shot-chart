(function () {



  function Area(options) {

    this.pxPerFt = options.pxPerFt;
    this.width = options.width;
    this.height = options.height;
    this.hexagonsPerRow = options.hexagonsPerRow;

    this.getOrigin = function () {
      var pxPerFt = this.pxPerFt;
      return {
        x: this.width/2/pxPerFt,
        y: this.height/pxPerFt - 5.353,
      };
    };

    this.getMeshRadius = function () {
      return this.width/this.hexagonsPerRow/Math.sin(Math.PI/3);
    };

    this.getDx = function () {
      return 2.0*Math.sin(Math.PI/3)*this.getMeshRadius();
    };

    this.getDy = function () {
      return 1.5*this.getMeshRadius();
    };

    this.translateX = function (point) {
      return this.pxPerFt*(this.getOrigin().x + point.x);
    };

    this.translateY = function (point) {
      return this.pxPerFt*(this.getOrigin().y - point.y);
    };

  }



  function Bin(options) {

    this.area = options.area;
    this.i = options.i;
    this.j = options.j;

    this.getId = function () {
      return this.i + ',' + this.j;
    };

    this.getX = function () {
      return this.area.getDx()*(this.i + (this.j & 1 ? 1/2 : 0));
    };

    this.getY = function () {
      return this.area.getDy()*(this.j);
    };

  }



  function asPoint() {

    // `.area`
    // `.x`
    // `.y`

    this.getX = function () {
      return this.area.translateX(this);
    };

    this.getY = function () {
      return this.area.translateY(this);
    };

    this.getBin = function () {

      var bin
        , py
        , pj
        , px
        , pi
        , py1
        , py2
        , pj2
        , px1
        , px2
        , pi2
        , dy = this.area.getDy()
        , dx = this.area.getDx()
      ;

      py = this.getY()/dy;
      pj = Math.round(py);

      px = this.getX()/dx;
      pi = Math.round(px);

      py1 = py - pj;

      if (3*Math.abs(py1) > 1) {
        px1 = px - pi;
        pj2 = pj + (py < pj ? -1 : 1);
        pi2 = pi + (px < pi ? -1 : 1)/2;
        py2 = py - pj2;
        px2 = px - pi2;
        if (px1*px1 + py1*py1 > px2*px2 + py2*py2) {
          pi = pi2 + (pj & 1 ? 1 : -1)/2;
          pj = pj2;
        }
      }

      bin = new Bin({
        area: this.area,
        i: pi,
        j: pj,
      });

      return bin;

    }

    return this;

  }



  this.Area = Area;
  this.Bin = Bin;
  this.asPoint = asPoint;



  function makeRadiusScaler(area, bins) {
    return d3.scale.sqrt()
      .domain([
        0,
        1,
        ss.quantile(bins.map(function (bin) { return bin.points.length; }), 0.9),
      ])
      .range([
        0,
        area.pxPerFt/2.5,
        area.getMeshRadius() - 0.1
      ])
      .clamp(true)
    ;
  }

  var colorScaler = d3.scale.linear()
    .domain([0, 0.8, 2])
    .range(['rgb(69, 117, 180)', 'rgb(255, 255, 191)', 'rgb(215, 48, 39)'])
    .interpolate(d3.interpolateLab)
  ;

  function getVertices(radius) {
    var angles = d3.range(0, 2*Math.PI, Math.PI/3)
      , x0 = 0
      , y0 = 0
      , x1
      , y1
      , dx
      , dy
      , angle
      , vertices = []
      , i = 0
    ;
    while (i < 7) {
      angle = angles[i];
      i += 1;
      x1 =  radius*Math.sin(angle);
      y1 = -radius*Math.cos(angle);
      dx = x1 - x0;
      dy = y1 - y0;
      vertices.push([dx, dy]);
      x0 = x1;
      y0 = y1;
    }
    return 'm' + vertices.join('l') + 'z';
  }

  function getSumPts(shots) {
    var i = 0
      , n = shots.length
      , shot
      , pts = 0
    ;
    while (i < n) {
      shot = shots[i];
      i += 1;
      if (shot.event_desc === 'Field Goal Made') {
        pts += shot.point_value;
      }
    }
    return pts;
  }

  function addHexAttrs(bin, area, radiusScaler, colorScaler) {

    var transform = 'translate(' + bin.x + ',' + bin.y + ')'
      , fga = bin.points.length

      , scaled = radiusScaler(fga)
      , vertices = getVertices(scaled)

      , pts = 0
      , i = 0
      , shot

      , efgPct
      , fill
      , stroke
    ;

    while (i < fga) {
      shot = bin.points[i];
      i += 1;
      if (shot.event_desc === 'Field Goal Made') {
        pts += shot.point_value;
      }
    }

    efgPct = pts/fga;
    fill = colorScaler(efgPct);
    stroke = d3.rgb(fill).darker();

    bin.fga = fga;
    bin.transform = transform;
    bin.d = vertices;
    bin.efgPct = efgPct;
    bin.style = {
      fill: fill,
    };
    bin.stroke = stroke;

  }

  /*function _makeBins(area, data) {

    var n = data.length
      , i = 0
      , datum
      , point
      , bin
      , binId
      , binsById = {}
      , radiusScaler
      , bins = []
      , m = 0
      , j = 0
    ;

    while (i < n) {
      datum = data[i];
      i += 1;
      if (datum.y < 28 && datum.x < 25 && datum.x > -25) {
        point = asPoint.call(datum);
        point.area = area;
        bin = point.getBin();
        binId = bin.getId();
        if (binsById.hasOwnProperty(binId)) {
          binsById[binId].points.push(point);
        } else {
          binsById[binId] = {
            i: bin.i,
            j: bin.j,
            x: bin.getX(),
            y: bin.getY(),
            id: binId,
            points: [point],
          };
        }
      }
    }

    for (binId in binsById) {
      if (binsById.hasOwnProperty(binId)) {
        bin = binsById[binId];
        bins.push(bin);
      }
    }

    radiusScaler = makeRadiusScaler(area, bins);
    m = bins.length;

    while (j < m) {
      addHexAttrs(bins[j], area, radiusScaler, colorScaler);
      j += 1;
    }

    return bins;

  }*/

  function makePoints(area, data) {

    var n = data.length
      , i = 0
      , datum
      , point
      , bin
      , points = []
    ;

    while (i < n) {
      datum = data[i];
      i += 1;
      if (datum.y < 28 && datum.x < 25 && datum.x > -25) {
        point = asPoint.call(datum);
        point.area = area;
        bin = point.getBin();
        point.bin = {
          i: bin.i,
          j: bin.j,
          x: bin.getX(),
          y: bin.getY(),
          id: bin.getId(),
        }
        points.push(point);
      }
    }

    return points;

  }

  function makeBins(area, points) {

    var n = points.length
      , i = 0
      , point
      , bin
      , binId
      , binsById = {}
      , radiusScaler
      , bins = []
      , m = 0
      , j = 0
    ;

    while (i < n) {
      point = points[i];
      i += 1;
      bin = point.bin
      binId = bin.id;
      if (binsById.hasOwnProperty(binId)) {
        binsById[binId].points.push(point);
      } else {
        binsById[binId] = {
          i: bin.i,
          j: bin.j,
          x: bin.x,
          y: bin.y,
          id: binId,
          points: [point],
        };
      }
    }

    for (binId in binsById) {
      if (binsById.hasOwnProperty(binId)) {
        bin = binsById[binId];
        bins.push(bin);
      }
    }

    radiusScaler = makeRadiusScaler(area, bins);
    m = bins.length;

    while (j < m) {
      addHexAttrs(bins[j], area, radiusScaler, colorScaler);
      j += 1;
    }

    return bins;

  }



  this.makePoints = makePoints;
  this.makeBins = makeBins;
  this.getSumPts = getSumPts;



}).call(this);
