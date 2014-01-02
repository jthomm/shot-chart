(function () {



  function efgPct(shots) {
    var pts = 0
      , i = 0
      , n = shots.length
      , shot
    ;
    while (i < n) {
      shot = shots[i];
      i += 1;
      if (shot.make) {
        pts += shot.point_value;
      }
    }
    return pts/shots.length;
  }

  var colorScale = d3.scale.linear()
    .domain([0, 0.8, 2])
    .range(['rgb(69, 117, 180)', 'rgb(255, 255, 191)', 'rgb(215, 48, 39)'])
    .interpolate(d3.interpolateLab)
  ;

  var hexagonAngles = d3.range(0, 2*Math.PI, Math.PI/3);

  var getHexD = function (radius) {
    var x0 = 0
      , y0 = 0
      , x1
      , y1
      , dx
      , dy
      , angle
      , angles = []
      , i = 0
    ;
    while (i < 7) {
      angle = hexagonAngles[i];
      i += 1;
      x1 =  radius*Math.sin(angle);
      y1 = -radius*Math.cos(angle);
      dx = x1 - x0;
      dy = y1 - y0;
      angles.push([dx, dy]);
      x0 = x1;
      y0 = y1;
    }
    return 'm' + angles.join('l') + 'z';
  };



  function asChart() {

    // `.pxPerFt`
    // `.graphWidth`
    // `.graphHeight`
    // `.hexagonsPerRow`

    this.getOrigin = function () {
      var pxPerFt = this.pxPerFt;
      return {
        x: this.graphWidth/2/pxPerFt,
        y: this.graphHeight/pxPerFt - 5.353,
      };
    };

    this.getMeshRadius = function () {
      return this.graphWidth/this.hexagonsPerRow/Math.sin(Math.PI/3);
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

    return this;

  }



  function asBin() {

    // `.chart`
    // `.i`
    // `.j`

    this.getId = function () {
      return this.i + ',' + this.j;
    };

    this.getX = function () {
      return this.chart.getDx()*(this.i + (this.j & 1 ? 1/2 : 0));
    };

    this.getY = function () {
      return this.chart.getDy()*(this.j);
    };

    return this;

  }


  function asPoint() {

    // `.chart`
    // `.x`
    // `.y`

    this.getX = function () {
      return this.chart.translateX(this);
    };

    this.getY = function () {
      return this.chart.translateY(this);
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
        , dy = this.chart.getDy()
        , dx = this.chart.getDx()
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

      bin = asBin.call({
        chart: this.chart,
        i: pi,
        j: pj,
      });

      return bin;

    }

    return this;

  }



  function fetchShooter(shooter) {
    var data = []
      , xreq = new XMLHttpRequest()
      , url = 'http://localhost:5000/api/shooter/'
    ;
    if (typeof shooter !== 'undefined') {
      url += shooter;
      xreq.open('GET', url, false);
      xreq.send(null);
      data = JSON.parse(xreq.responseText);
    }
    return data;
  }



  //var shooter = 'Anthony, Carmelo';
  //var shooter = 'Durant, Kevin';
  //var shooter = 'Bryant, Kobe';
  //var shooter = 'James, LeBron';
  //var shooter = 'Harden, James';
  //var shooter = 'Westbrook, Russell';
  //var shooter = 'Ellis, Monta';
  //var shooter = 'Smith, J.R.';
  //var shooter = 'Curry, Stephen';
  //var shooter = 'Horford, Al';
  //var shooter = 'Wade, Dwyane';
  var shooter = 'Anderson, Ryan';
  //var shooter = 'Parker, Tony';
  //var shooter = 'Thompson, Klay';

  var data = fetchShooter(shooter);

  var shots = Q(data).findAll({
    //is_fast_break: false,
    //assist: null,
    //shooter: shooter,
    //tags: 'alley oop'
    //team: 'NY',
    //oppt: 'LAL',
    y: function (y) { return y < 27; },
    x: function (x) { return x > -25 && x < 25 },
  });

  var i = 0
    , n = shots.length
    , shot
    , bin
    , bins = []
    , point
    , points = []
  ;

  var chart = asChart.call({
    pxPerFt: 10,
    graphWidth: 600,
    graphHeight: 365,
    hexagonsPerRow: 30,
  });

  while (i < n) {
    shot = shots[i]
    shot.chart = chart;
    point = asPoint.call(shot);
    bin = point.getBin();
    point.bin_i = bin.i;
    point.bin_j = bin.j;
    point.bin_x = bin.getX();
    point.bin_y = bin.getY();
    point.bin_id = bin.getId();
    points.push(point);
    i += 1;
  }

  bins = Q(points).groupBy('bin_id', 'bin_x', 'bin_y');

  this.points = points;
  this.bins = bins;



  var radiusScale = d3.scale.sqrt()
    .domain([
      0,
      1,
      ss.quantile(bins.map(function (bin) { return bin.$.length; }), 0.9)
    ])
    .range([
      0,
      chart.pxPerFt/2.5,
      chart.getMeshRadius()
    ])
  ;




  BinView = React.createClass({
    render: function () {
      var bin = this.props.bin
        , meshRadius = chart.getMeshRadius()
        , radius = radiusScale(bin.$.length)
        , d = getHexD(radius > meshRadius ? meshRadius : radius)
        , transform = 'translate(' + bin.bin_x + ',' + bin.bin_y + ')'
        , fill = colorScale(efgPct(bin.$))
        , style = {fill: fill}
        , stroke = d3.rgb(fill).darker()
      ;
      return React.DOM.path({
        className: 'hexagon',
        d: d,
        transform: transform,
        style: style,
        stroke: stroke,
        'data-binid': this.props.bin.bin_id
      });
    }
  });

  MainView = React.createClass({
    render: function () {
      return React.DOM.svg({
        width: chart.graphWidth,
        height: chart.graphHeight,
        children: this.props.bins.map(function (bin) {
          return BinView({bin: bin})
        }),
      });
    }
  });

  React.renderComponent(
    MainView({bins: bins}),
    document.getElementById('graph')
  );

  React.renderComponent(
    React.DOM.h3({children: shooter}),
    document.getElementById('title')
  );



}).call(this)
