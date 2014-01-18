/** @jsx React.DOM */



var area = new Area({
  pxPerFt: 10,
  width: 600,
  height: 375,
  hexagonsPerRow: 26,
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



var ChartArea = React.createClass({

  render: function () {
    console.log('[LOGGING]\t', 'ChartArea', 'render', this.state);
    var style = {
      width: area.width,
      height: area.height,
      backgroundSize: 500,
      backgroundImage: "url('/static/court.png')",
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'bottom center',
      margin: '0 auto',
    };
    return (
      <div className='row'>
        <div style={style}>
          {this.props.chartContents}
        </div>
      </div>
    );
  },

});



var ShotChart = React.createClass({

  render: function () {
    console.log('[LOGGING]\t', 'ShotChart', 'render', this.state);
    var i = 0
      , n = this.props.bins.length
      , bin
      , hexagons = []
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
      <svg width={area.width} height={area.height}>
        {hexagons}
      </svg>
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
      selectedTeam: null,
    };
  },

  selectOption: function (option) { this.setState({selectedOption: option}); },

  setTypeAhead: function (data) {
    console.log('[LOGGING]\t', 'Search', 'setTypeAhead', this.state);
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
          this.setState({selectedTeam: datum});
          return false;
        }.bind(this));
      }.bind(this),
    });
  },

  componentDidMount: function () { this.setTypeAhead(); },

  onSubmit: function (e) {
    console.log('[LOGGING]\t', 'Search', 'onSubmit', this.state);
    e.preventDefault();
    if (this.state.selectedTeam) {
      this.props.loadShotsFromServer(
        this.state.selectedOption.toLowerCase(),
        this.state.selectedTeam
      );
    }
    $(this.refs.search.getDOMNode()).typeahead('setQuery', '');
    return false;
  },

  render: function () {
    console.log('[LOGGING]\t', 'Search', 'render', this.state);
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



var Statistic = React.createClass({

  render: function () {
    return (
      <div className='col-md-3 stat'>
        <h3>{this.props.value}</h3>
        <h4 className='text-muted'>{this.props.name}</h4>
      </div>
    );
  },

});



var Stats = React.createClass({

  render: function () {
    console.log('[LOGGING]\t', 'Stats', 'render', this.state);
    var q = Q(this.props.points)
      , fga = this.props.points.length
      , fgm = q.findAll({event_desc: 'Field Goal Made'}).length
      , wpa = q.findAll({point_value: 2}).length
      , wpm = q.findAll({event_desc: 'Field Goal Made', point_value: 2}).length
      , wpp = fga === 0 ? '\u00A0' : (100*(wpm/wpa)).toFixed(1)
      , hpp = fga === 0 ? '\u00A0' : (100*((fgm - wpm)/(fga - wpa))).toFixed(1)
      , pts = getSumPts(this.props.points)
      , efg = fga === 0 ? '\u00A0' : (pts/fga).toFixed(2)
    ;
    return (
      <div className='row'>
        <Statistic value={fga === 0 ? '\u00A0' : fga} name='FGA' />
        <Statistic value={efg} name='PPS' />
        <Statistic value={wpp} name='2p%' />
        <Statistic value={hpp} name='3p%' />
      </div>
    );
  },

});



var Row = React.createClass({

  render: function () {
    var shot = this.props.shot;
    return (
      <tr>
        <td>{shot.date.toUTCString().slice(5, 16)}</td>
        <td>{shot.off_abbr}</td>
        <td>{shot.is_home ? '@' : '\u00A0'}</td>
        <td>{shot.def_abbr}</td>
        <td>{[shot.shooter.first_name, shot.shooter.last_name].join(' ')}</td>
        <td>{shot.details}</td>
        <td>{shot.point_value}</td>
        <td>{shot.is_make ? 'Made' : 'Missed'}</td>
      </tr>
    );
  },

});



var PageNumber = React.createClass({

  onClick: function (e) {
    e.preventDefault();
    this.props.onClick(this.props.key);
    return false;
  },

  render: function () {
    return (
      <li className={this.props.isActive ? 'active' : ''}>
        <a href='#' onClick={this.onClick}>{this.props.key}</a>
      </li>
    );
  },

});



var Table = React.createClass({

  getInitialState: function () {
    return {
      page: 1,
    };
  },

  setPage: function (page) { this.setState({page: page}); },

  render: function () {
    console.log('[LOGGING]\t', 'Table', 'render', this.state);
    var rowsPerPage = this.props.rowsPerPage

      , numPages = Math.ceil(this.props.shots.length/rowsPerPage)
      , i = this.state.page - 4
      , leftExcess = Math.max(1 - i, 0)
      , n = i + 9
      , rightExcess = Math.max(n - numPages, 0)
      , pages = []

      , until = this.state.page*rowsPerPage
      , start = until - rowsPerPage
      , shot
      , key
      , rows = []
    ;
    i += leftExcess;
    n += leftExcess;
    i -= rightExcess;
    n -= rightExcess;
    while (i <= n) {
      pages.push(<PageNumber isActive={i === this.state.page} onClick={this.setPage} key={i} />);
      i += 1;
    }
    while (start < until) {
      shot = this.props.shots[start];
      start += 1;
      key = [
        shot.game_id,
        shot.quarter,
        shot.minutes,
        shot.seconds,
        shot.x,
        shot.y,
      ].join(',');
      rows.push(<Row shot={shot} key={key} />);
    }
    return (
      <div className='col-md-12'>
        <table className='table table-condensed table-hover'>
          <thead>
            <tr>
              <th>{'Date'}</th>
              <th>Team</th>
              <th>{'\u00A0'}</th>
              <th>Oppt</th>
              <th>Shooter</th>
              <th>Description</th>
              <th>Value</th>
              <th>Result</th>
            </tr>
          </thead>
          <tbody>
            {rows}
          </tbody>
        </table>
        <ul className='pagination'>
          {pages}
        </ul>
      </div>
    );
  },

});

/*
              <th className='dropdown'>
                <a href='#' className='dropdown-toggle' data-toggle='dropdown'>
                  {'Date'}
                </a>
                <ul className='dropdown-menu'>
                  <li><a href='#'>20131225</a></li>
                  <li><a href='#'>20131224</a></li>
                </ul>
              </th>
              <th className='dropdown'>
                <a href='#' className='dropdown-toggle' data-toggle='dropdown'>
                  Value
                </a>
                <ul className='dropdown-menu'>
                  {pointValues}
                </ul>
              </th>
              <th className='dropdown'>
                <a href='#' className='dropdown-toggle' data-toggle='dropdown'>
                  Value
                </a>
                <ul className='dropdown-menu'>
                  {pointValues}
                </ul>
              </th>
*/


var App = React.createClass({

  getInitialState: function () {
    return {
      team: null,
      points: [],
      isLoading: false,
    };
  },

  loadShotsFromServer: function (option, team) {
    console.log('[LOGGING]\t', 'App', 'loadShotsFromServer', this.state);
    this.setState({
      team: team,
      points: [],
      isLoading: true,
    });
    $.ajax({
      url: 'http://localhost:5000/api/shots/' + option + '/' + team.abbr,
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
    console.log('[LOGGING]\t', 'App', 'render', this.state);
    var chartContents = this.state.isLoading
        ? <Spinner />
        : <ShotChart bins={makeBins(area, this.state.points)} />
      , team = this.state.team
      , teamName = team
        ? <h4>{team.name.toUpperCase()}</h4>
        : <h4 className='text-muted'>Choose a team</h4>
      , table = this.state.points.length > 0 ? <Table shots={this.state.points} rowsPerPage={20} /> : <table></table>;
    ;
    return (
      <div>
        <div className='col-md-12'>


          <div className='row marg-bot'>
            <div className='col-md-4'>
              <Search loadShotsFromServer={this.loadShotsFromServer} />
            </div>
          </div>


          <div className='row marg-bot'>
            <div className='col-md-4'>
              {teamName}
              <Stats points={this.state.points} />
            </div>
            <div className='col-md-8'>
              <ChartArea chartContents={chartContents} />
            </div>
          </div>


          <div className='row'>
            {table}
          </div>


        </div>
      </div>
    );
  },

});



React.renderComponent(<App />, document.getElementById('app'));
