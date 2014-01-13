/** @jsx React.DOM */



var area = new Area({
  pxPerFt: 10,
  width: 600,
  height: 375,
  hexagonsPerRow: 26,
});



/*var ShooterChoice = React.createClass({

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



var ShooterList = React.createClass({
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



var ShotChart = React.createClass({

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



var SearchForm = React.createClass({

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

});*/



var TeamChoice = React.createClass({

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



var DivisionChoice = React.createClass({

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



var TeamNav = React.createClass({

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
      <div className="bs-sidebar hidden-print" role="complementary">
        <ul className="nav bs-sidenav">
          {divisionChoices}
        </ul>
      </div>
    );
  },

});



var Popover = React.createClass({
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



var Hexagon = React.createClass({

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



var ShotChart = React.createClass({

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



var SearchOpt = React.createClass({

  onClick: function (e) {
    e.preventDefault();
    this.props.selectOption(this.props.option);
    return false;
  },

  render: function () {
    return <li onClick={this.onClick}><a href='#'>{this.props.option}</a></li>;
  },

});



var Search = React.createClass({

  getInitialState: function () {
    return {
      selectedOption: 'Offense',
      selectedTeamAbbr: null,
    };
  },

  selectOption: function (option) { this.setState({selectedOption: option}); },

  setTypeAhead: function (data) {
    $.ajax({
      url: 'http://localhost:5000/api/teams',
      success: function (data) {
        var teams = data.teams
          , n = teams.length
          , i = 0
          , team
          , $el = $(this.refs.search.getDOMNode())
        ;
        while (i < n) {
          team = teams[i];
          i += 1;
          team.name = [team.locating, team.nickname].join(' ');
        }
        $el.typeahead({name: 'team-search', local: teams, valueKey: 'name',});
        $el.on('typeahead:selected', function (e, datum) {
          e.preventDefault();
          this.setState({selectedTeamAbbr: datum.abbr});
          return false;
        }.bind(this));
      }.bind(this),
    });
  },

  componentDidMount: function () { this.setTypeAhead(); },

  onSubmit: function (e) {
    e.preventDefault();
    if (this.state.selectedTeamAbbr) {
      this.props.loadShotsFromServer(
        this.state.selectedOption.toLowerCase(),
        this.state.selectedTeamAbbr
      );
    }
    $(this.refs.search.getDOMNode()).typeahead('setQuery', '');
    return false;
  },

  render: function () {
    return (
      <form className='form-inline' role='form' onSubmit={this.onSubmit}>
        <div className='input-group'>
          <div className='input-group-btn'>
            <button
             type='button'
             className='btn btn-default dropdown-toggle'
             data-toggle='dropdown'>
              {this.state.selectedOption}
              {'\u00A0'}
              <i className='fa fa-caret-down'></i>
            </button>
            <ul className='dropdown-menu'>
              <SearchOpt option='Offense' selectOption={this.selectOption} />
              <SearchOpt option='Defense' selectOption={this.selectOption} />
            </ul>
          </div>
          <input type='text' className='form-control' ref='search' />
          <input type='submit' className='hidden-submit' />
        </div>
      </form>
    );
  },

});



var Stats = React.createClass({

  render: function () {
    var fga = this.props.points.length
      , pts = getSumPts(this.props.points)
      , efg = fga === 0 ? '' : (pts/fga).toFixed(2)
    ;
    return (
      <span>
        <h3>{fga} <span className='muted'>FGA</span></h3>
        <h3>{efg} <span className='muted'>eFG%</span></h3>
      </span>
    );
  },

});



var App = React.createClass({

  getInitialState: function () {
    return {
      points: [],
      isLoading: false,
    };
  },

  loadShotsFromServer: function (option, value) {
    this.setState({isLoading: true});
    $.ajax({
      url: 'http://localhost:5000/api/shots/' + option + '/' + value,
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
    var chartArea = this.state.isLoading
      ? <h3>LOADING...</h3>
      : <ShotChart bins={makeBins(area, this.state.points)} />
    ;
    return (
      <div>
        <div className='col-md-5'>
          <Search loadShotsFromServer={this.loadShotsFromServer} />
        </div>
        <div className='col-md-7'>
          <Stats points={this.state.points} />
          {chartArea}
        </div>
      </div>
    );
  },

});



React.renderComponent(<App />, document.getElementById('app'));
