(function () {



  function getEfgPct(shots) {
    var pts = 0
      , i = 0
      , n = shots.length
      , shot
    ;
    while (i < n) {
      shot = shots[i];
      i += 1;
      if (shot.event_desc === 'Field Goal Made') {
        pts += shot.point_value;
      }
    }
    return pts/shots.length;
  }

  function getRadiusScaler(bins, pxPerFt, meshRadius) {
    return d3.scale.sqrt()
      .domain([
        0,
        1,
        ss.quantile(bins.map(function (bin) { return bin.$.length; }), 0.9)
      ])
      .range([
        0,
        pxPerFt/2.5,
        meshRadius
      ])
    ;
  }

  function getColorScaler() {
    return colorScaler = d3.scale.linear()
      .domain([0, 0.8, 2])
      .range(['rgb(69, 117, 180)', 'rgb(255, 255, 191)', 'rgb(215, 48, 39)'])
      .interpolate(d3.interpolateLab)
    ;
  }

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
  };




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




  var chart = new Chart({
    pxPerFt: 10,
    graphWidth: 600,
    graphHeight: 375,
    hexagonsPerRow: 26,
  });



  var colorScaler = getColorScaler();

  
  var PopOver = React.createClass({
    render: function () {
      return React.DOM.table({
        children: [
          React.DOM.tr({
            children: [
              React.DOM.td({
                style: {
                  'padding-right': '20px',
                },
                children: 'FGA',
              }),
              React.DOM.td({
                style: {
                  'text-align': 'right',
                },
                children: this.props.fga,
              }),
            ],
          }),
          React.DOM.tr({
            children: [
              React.DOM.td({
                style: {
                  'padding-right': '20px',
                },
                children: 'eFG%',
              }),
              React.DOM.td({
                children: this.props.efgPct.toFixed(2),
              }),
            ],
          }),
        ],
      });
    },
  });


  var Hexagon = React.createClass({
    setPopover: function () {
      var $el = $(this.getDOMNode());
      $el.popover('destroy');
      React.renderComponentToString(
        PopOver({
          fga: this.props.fga,
          efgPct: this.props.efgPct,
        }),
        function (html) {
          $el.popover({
            html: true,
            content: html,
            trigger: 'hover',
            placement: 'top',
            container: '#app',
          });
        }
      );
    },
    componentDidMount: function () { this.setPopover(); },
    componentDidUpdate: function () { this.setPopover(); },
    render: function () {
      return React.DOM.path({
        className: 'hexagon',
        transform: 'translate(' + this.props.x + ',' + this.props.y + ')',
        stroke: d3.rgb(this.props.fill).darker(),
        style: {fill: this.props.fill},
        key: this.props.key,
        d: this.props.vertices,
        'data-binid': this.props.key,
      });
    },
  });

  var ShotChart = React.createClass({
    loadShotsFromServer: function (shooter) {
      $.ajax({
        url: 'http://localhost:5000/api/team/' + shooter,
        success: function (shots) {
          var n = shots.length
            , i = 0
            , shot
            , point
            , points = []
            , bins
          ;
          while (i < n) {
            shot = shots[i];
            if (shot.y < 28 && shot.x < 25 && shot.x > -25) {
              point = asPoint.call(shot);
              point.chart = chart;
              point.bin = point.getBin();
              points.push(point);
            }
            i += 1;
          }
          bins = Q(points).groupBy('bin');
          this.setState({bins: bins});
        }.bind(this),
      });
    },
    getInitialState: function () {
      return {bins: []};
    },
    render: function () {
      var radiusScaler = getRadiusScaler(
        this.state.bins,
        chart.pxPerFt,
        chart.getMeshRadius()
      );
      return React.DOM.div({
        className: 'col-md-8',
        children: [
          React.DOM.div({
            className: 'graph',
            children: [
              React.DOM.svg({
                width: chart.graphWidth,
                height: chart.graphHeight,
                children: this.state.bins.map(function (bin) {
                  var meshRadius = chart.getMeshRadius() - 0.25
                    , scaled = radiusScaler(bin.$.length)
                    , radius = scaled > meshRadius ? meshRadius : scaled
                    , vertices = getVertices(radius)
                    , efgPct = getEfgPct(bin.$)
                    , fill = colorScaler(efgPct)
                    , key = bin.bin.getId()
                  ;
                  return Hexagon({
                    vertices: vertices,
                    fill: fill,
                    key: key,
                    x: bin.bin.getX(),
                    y: bin.bin.getY(),
                    efgPct: efgPct,
                    fga: bin.$.length,
                  });
                }),
              }),
            ],
          }),
        ],
      });
    },
  });

  var SearchForm = React.createClass({

    handleSubmit: function (e) {
      e.preventDefault();
      var shooter = this.refs.shooter.getDOMNode().value.trim();
      if (!shooter) {
        return false;
      }
      this.props.loadShotsFromServer(shooter);
      this.refs.shooter.getDOMNode().value = '';
      return false;
    },

    render: function () {

      return React.DOM.div({

        className: 'col-md-4',
        children: [

          React.DOM.form({

            className: 'form-inline',
            role: 'form',
            onSubmit: this.handleSubmit,
            children: [

              React.DOM.div({

                className: 'form-group',
                children: [

                  React.DOM.label({
                    className: 'sr-only',
                    htmlFor: 'search',
                    children: 'Search',
                  }),


                  React.DOM.input({
                    type: 'text',
                    className: 'form-control',
                    placeholder: 'Search...',
                    ref: 'shooter',
                  }),

                ], // form-group children

              }), // form-group

              ' ',

              React.DOM.button({
                type: 'submit',
                className: 'btn btn-default',
                children: 'Chart!',
              }),

            ], // form children

          }), // form

        ], // column children

      }); // column
       
    },

  });

  var App = React.createClass({
    render: function () {
      var chart = ShotChart({});
      return React.DOM.div({
        children: [
          SearchForm({
            loadShotsFromServer: chart.loadShotsFromServer.bind(chart),
          }),
          chart,
        ],
      });
    },
  });

  React.renderComponent(
    App({}),
    document.getElementById('app')
  );

            



}).call(this)
