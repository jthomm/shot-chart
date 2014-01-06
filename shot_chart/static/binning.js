(function () {



  function Chart(options) {

    this.pxPerFt = options.pxPerFt;
    this.graphWidth = options.graphWidth;
    this.graphHeight = options.graphHeight;
    this.hexagonsPerRow = options.hexagonsPerRow;

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

  }



  function Bin(options) {

    this.chart = options.chart;
    this.i = options.i;
    this.j = options.j;

    this.getId = function () {
      return this.i + ',' + this.j;
    };

    this.getX = function () {
      return this.chart.getDx()*(this.i + (this.j & 1 ? 1/2 : 0));
    };

    this.getY = function () {
      return this.chart.getDy()*(this.j);
    };

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

      bin = new Bin({
        chart: this.chart,
        i: pi,
        j: pj,
      });

      return bin;

    }

    return this;

  }



  this.Chart = Chart;
  this.Bin = Bin;
  this.asPoint = asPoint;



}).call(this);
