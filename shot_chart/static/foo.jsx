//// binning.js ////

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
        area.getMeshRadius()
      ])
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

  function addHexAttrs(bin, area, radiusScaler, colorScaler) {

    var transform = 'translate(' + bin.x + ',' + bin.y + ')'
      , fga = bin.points.length

      , maxRadius = area.getMeshRadius() - 0.25
      , scaled = radiusScaler(fga)
      , radius = scaled > maxRadius ? maxRadius : scaled
      , vertices = getVertices(radius)

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
    bin.radius = radius;

  }

  function _makeBins(area, data) {

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

  }

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
      if (datum.y < 28 && datum.x < 25 && datum.x > -25) { // for consistency
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
      } // for consistency
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

  function __makeBins(area, points) {

    var groups = Q(points).groupBy('bin')
      , n = groups.length
      , i = 0
      , group
      , radiusScaler
      , bins = []
      , m = 0
      , j = 0
    ;
    while (i < n) {
      group = groups[i];
      i += 1;
      bins.push({
        i: group.bin.i,
        j: group.bin.j,
        x: group.bin.x,
        y: group.bin.y,
        id: group.bin.id,
        points: group.$,
      });
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



}).call(this);

//// app.jsx ////

/** @jsx React.DOM */



var area = new Area({
  pxPerFt: 10,
  width: 600,
  height: 375,
  hexagonsPerRow: 26,
});



/*
ShooterChoice = React.createClass({

  onClick: function (e) {
    e.preventDefault();
    this.props.selectShooter(this.props.key);
    return false;
  },

  render: function () {
    return (
      <li className={this.props.isActive ? 'active' : ''}>
        <a href="#" onClick={this.onClick}>
          {this.props.name}
          {'\u00A0'}
          <span className='badge'>{this.props.fga}</span>
        </a>
      </li>
    );
  },

});



ShooterList = React.createClass({
  render: function () {
    var selectShooter = this.props.selectShooter;
    var selectedShooter = this.props.selectedShooter;
    var shooterChoices = this.props.shooters.map(function (shooter) {
      var info = shooter.shooter;
      return (
        <ShooterChoice
         key={info.si_id}
         name={info.first_name + ' ' + info.last_name}
         fga={shooter.$.length}
         isActive={info.si_id === selectedShooter}
         selectShooter={selectShooter}
        />
      );
    });
    return (
      <div className='well well-sm'>
        <ul className='nav nav-pills nav-stacked'>
        {shooterChoices}
        </ul>
      </div>
    );
  },
});



ShotChart = React.createClass({

  render: function () {
    var radiusScaler = getRadiusScaler(
      this.props.bins,
      area.pxPerFt,
      area.getMeshRadius()
    );
    var selectedShooter = this.props.selectedShooter;
    var hexagons = this.props.bins.map(function (bin) {
      var meshRadius = area.getMeshRadius() - 0.25
        , scaled = radiusScaler(bin.$.length)
        , radius = scaled > meshRadius ? meshRadius : scaled
        , vertices = getVertices(radius)
        , efgPct = getEfgPct(bin.$)
        , fill = colorScaler(efgPct)
        , key = bin.bin.getId()
      ;
      return (
        <Hexagon
         vertices={vertices}
         fill={fill}
         key={key}
         x={bin.bin.getX()}
         y={bin.bin.getY()}
         efgPct={efgPct}
         fga={bin.$.length}
         selectedShooter={selectedShooter}
        />
      );
    });
    var style = {
      width: area.width,
      height: area.width,
      backgroundSize: 500,
      backgroundImage: "url('/static/court.png')",
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'bottom center',
    };
    return (
      <div style={style}>
        <svg width={area.width} height={area.height}>
          {hexagons}
        </svg>
      </div>
    );
  },

});



SearchForm = React.createClass({

  onSubmit: function (e) {
    e.preventDefault();
    var $el = this.refs.shooter.getDOMNode()
      , shooter = $el.value.trim();
    ;
    if (shooter !== '') {
      this.props.loadShotsFromServer(shooter);
      $el.value = '';
    }
    return false;
  },

  render: function () {
    return (
      <form className='form-inline' role='form' onSubmit={this.onSubmit}>
        <div className='form-group'>
          <label className='sr-only' htmlFor='search'>Search</label>
          <input
           className='form-control'
           type='text'
           placeholder='Search...'
           ref='shooter'
          />
        </div>
        {'\u00A0'}
        <button className='btn btn-default' type='submit'>Chart!</button>
      </form>
    );
  },

});
*/



TeamChoice = React.createClass({

  onClick: function (e) {
    e.preventDefault();
    this.props.selectTeam(this.props.abbr);
    this.props.loadShotsFromServer(this.props.abbr);
    return false;
  },

  render: function () {
    return (
      <li onClick={this.onClick} className={this.props.isActive ? 'active' : ''}>
        <a href="#">{this.props.locating + ' ' + this.props.nickname}</a>
      </li>
    );
  },

});



DivisionChoice = React.createClass({

  onClick: function (e) {
    e.preventDefault();
    this.props.selectDivision(this.props.division);
    return false;
  },

  render: function () {
    var teamChoices = this.props.teams.map(function (team) {
      return (
        <TeamChoice
         loadShotsFromServer={this.props.loadShotsFromServer}
         selectTeam={this.props.selectTeam}
         locating={team.locating}
         nickname={team.nickname}
         isActive={this.props.activeTeam === team.abbr}
         abbr={team.abbr}
         key={team.abbr}
        />
      );
    }.bind(this));
    return (
      <li onClick={this.onClick} className={this.props.isActive ? 'active' : ''}>
        <a href="#">{this.props.division}</a>
        <ul className='nav'>
          {teamChoices}
        </ul>
      </li>
    );
  },

});



TeamNav = React.createClass({

  getInitialState: function () {
    return {
      divisions: [],
      selectedDivision: null,
      selectedTeam: null,
    };
  },

  selectDivision: function (divisionName) {
    this.setState({selectedDivision: divisionName});
  },

  selectTeam: function (teamAbbr) {
    this.setState({selectedTeam: teamAbbr});
  },

  loadTeamsFromServer: function () {
    $.ajax({
      url: 'http://localhost:5000/api/teams',
      success: function (data) {
        var divisionNames = [
          'Atlantic', 'Central', 'Southeast',
          'Pacific', 'Northwest', 'Southwest',
        ];
        var divisions = divisionNames.map(function (divisionName) {
          var teams = Q(data.teams).findAll({division: divisionName});
          return {
            teams: teams,
            division: divisionName,
          };
        });
        this.setState({divisions: divisions});
      }.bind(this),
    });
  },

  componentWillMount: function () { this.loadTeamsFromServer(); },

  render: function () {
    var divisionChoices = this.state.divisions.map(function (division) {
      return (
        <DivisionChoice
         loadShotsFromServer={this.props.loadShotsFromServer}
         selectDivision={this.selectDivision}
         selectTeam={this.selectTeam}
         division={division.division}
         isActive={this.state.selectedDivision === division.division}
         activeTeam={this.state.selectedTeam}
         teams={division.teams}
         key={division.division}
        />
      );
    }.bind(this));
    return (
      <div className="bs-sidebar hidden-print affix" role="complementary">
        <ul className="nav bs-sidenav">
          {divisionChoices}
        </ul>
      </div>
    );
  },

});



Popover = React.createClass({
  render: function () {
    return (
      <table>
        <tr>
          <td className='hex-pop-td-left'>FGA</td>
          <td className='hex-pop-td-right'>{this.props.fga}</td>
        </tr>
        <tr>
          <td className='hex-pop-td-left'>eFG%</td>
          <td className='hex-pop-td-right'>{this.props.efgPct.toFixed(2)}</td>
        </tr>
      </table>
    );
  },
});



Hexagon = React.createClass({

  render: function () {
    return (
      <path
       className='hexagon'
       transform={this.props.transform}
       stroke={this.props.stroke}
       style={this.props.style}
       key={this.props.key}
       d={this.props.d}
       data-binid={this.props.key}
       data-radius={this.props.radius}
      ></path>
    );
  },

  setPopover: function () {
    var $el = $(this.getDOMNode());
    $el.popover('destroy');
    React.renderComponentToString(
      <Popover fga={this.props.fga} efgPct={this.props.efgPct} />,
      function (html) {
        $el.popover({
          html: true,
          content: html,
          trigger: 'hover',
          placement: 'top',
          container: 'body',
        });
      }
    );
  },

  componentDidMount: function () { this.setPopover(); },

  componentDidUpdate: function () { this.setPopover(); },

});



ShotChart = React.createClass({

  render: function () {
    var i = 0
      , n = this.props.bins.length
      , bin
      , hexagons = []
      , style = {
      width: area.width,
      height: area.height,
      backgroundSize: 500,
      backgroundImage: "url('/static/court.png')",
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'bottom center',
    }
    ;
    while (i < n) {
      bin = this.props.bins[i];
      i += 1;
      hexagons.push(
        <Hexagon
         fga={bin.fga}
         efgPct={bin.efgPct}
         transform={bin.transform}
         stroke={bin.stroke}
         style={bin.style}
         key={bin.id}
         d={bin.d}
         radius={bin.radius}
        />
      );
    }
    return (
      <div style={style}>
        <svg width={area.width} height={area.height}>
          {hexagons}
        </svg>
      </div>
    );
  },

});



App = React.createClass({

  getInitialState: function () {
    return {
      points: [],
      isLoading: true,
    };
  },

  componentWillMount: function () { this.setState({isLoading: false,}); },

  loadShotsFromServer: function (team) {
    this.setState(this.getInitialState());
    $.ajax({
      url: 'http://localhost:5000/api/shots/team/' + team,
      success: function (data) {
        var points = makePoints(area, data);
        this.setState({
          points: points,
          isLoading: false,
        });
      }.bind(this),
    });
  },

  render: function () {
    var chartArea = this.state.isLoading ? <h3>LOADING...</h3> : <ShotChart bins={makeBins(area, this.state.points)} />;
    return (
      <div>
        <div className='col-md-4'>
          <TeamNav loadShotsFromServer={this.loadShotsFromServer} />
        </div>
        <div className='col-md-8'>
          {chartArea}
        </div>
      </div>
    );
  },

});


React.renderComponent(<App />, document.getElementById('app'));
