/** @jsx React.DOM */



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



function getPoints(shots) {
  var n = shots.length
    , i = 0
    , shot
    , point
    , points = []
  ;
  while (i < n) {
    shot = shots[i];
    if (shot.y < 28 && shot.x < 25 && shot.x > -25) {
      shot.shooter = shot.players[0];
      point = asPoint.call(shot);
      point.chart = chart;
      point.bin = point.getBin()
      points.push(point);
    }
    i += 1;
  }
  return points;
}




function requestShots(team) {
  var data = []
    , xreq = new XMLHttpRequest()
    , url = 'http://localhost:5000/api/team/'
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

  render: function () {
    var style = {
      fill: this.props.fill,
    };
    return (
      <path
       className='hexagon'
       transform={'translate(' + this.props.x + ',' + this.props.y + ')'}
       stroke={d3.rgb(this.props.fill).darker()}
       style={style}
       key={this.props.key}
       d={this.props.vertices}
       data-binid={this.props.key}
      ></path>
    );
  },

});



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
      chart.pxPerFt,
      chart.getMeshRadius()
    );
    var selectedShooter = this.props.selectedShooter;
    var hexagons = this.props.bins.map(function (bin) {
      var meshRadius = chart.getMeshRadius() - 0.25
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
      width: chart.graphWidth,
      height: chart.graphHeight,
      backgroundSize: 500,
      backgroundImage: "url('/static/court.png')",
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'bottom center',
    };
    return (
      <div className='col-md-8'>
        <div style={style}>
          <svg width={chart.graphWidth} height={chart.graphHeight}>
            {hexagons}
          </svg>
        </div>
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



App = React.createClass({

  getInitialState: function () {
    return {
      points: Q([]),
      shooters: [],
      selectedShooter: null,
    };
  },

  loadShotsFromServer: function (team) {
    $.ajax({
      url: 'http://localhost:5000/api/shots/team/' + team,
      success: function (shots) {
        var points = Q(getPoints(shots))
          , shooters = points.groupBy('shooter')
        ;
        shooters.sort(function (a, b) { return b.$.length - a.$.length; });
        this.setState({
          points: points,
          shooters: shooters,
          selectedShooter: null,
        });
      }.bind(this),
    });
  },

  selectShooter: function (si_id) {
    var shooter = this.state.selectedShooter === si_id ? null : si_id;
    this.setState({selectedShooter: shooter});
  },

  render: function () {
    var selectedShooter = this.state.selectedShooter
      , points = selectedShooter
               ? this.state.points.findAll({shooter: {si_id: selectedShooter}})
               : this.state.points
      , bins = points.groupBy('bin')
    ;
    return (
      <div>
        <div className='col-md-4'>
          <div className='row'>
            <SearchForm loadShotsFromServer={this.loadShotsFromServer} />
          </div>
          <div className='row'>
            <ShooterList
             shooters={this.state.shooters}
             selectShooter={this.selectShooter}
             selectedShooter={this.state.selectedShooter}
            />
          </div>
        </div>
        <ShotChart bins={bins} />
      </div>
    );
  },

});



React.renderComponent(<App />, document.getElementById('app'));



TeamChoice = React.createClass({

  onClick: function (e) {
    e.preventDefault();
    //this.props.renderTeam(this.props.key)
    return false;
  },

  render: function () {
    return (
      <li onClick={this.onClick}>
        <a href="#">{this.props.locating + ' ' + this.props.nickname}</a>
      </li>
    );
  },

});



TeamNav = React.createClass({

  getInitialState: function () { return {teams: []}; },

  loadTeamsFromServer: function () {
    $.ajax({
      url: 'http://localhost:5000/api/teams',
      success: function (data) {
        this.setState({teams: data.teams});
      }.bind(this),
    });
  },

  render: function () {
    this.loadTeamsFromServer();
    var teamChoices = this.state.teams.map(function (team) {
      return (
        <TeamChoice
         locating={team.locating}
         nickname={team.nickname}
         key={team.abbr}
        />
      );
    });
    return (
      <div className="bs-sidebar hidden-print affix" role="complementary">
        <ul className="nav bs-sidenav">
          {teamChoices}
        </ul>
      </div>
    );
  },

});



React.renderComponent(<TeamNav />, document.getElementById('nav'));
