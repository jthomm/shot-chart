/** @jsx React.DOM */



var BASE_URL = 'http://localhost:5000/api/shots';

var area = new Area({
  pxPerFt: 10,
  width: 600,
  height: 375,
  hexagonsPerRow: 26,
});



function run(data) {



  var points = makePoints(area, data)
    , q = Q(points)
    , oppts = q.project('def_abbr').map(function (d) { return d.def_abbr; })
    , shooters = q.project('shooter_name').map(function (d) { return d.shooter_name; })
  ;
  window.points = points;



  var Clickable = React.createClass({

    onClick: function (e) {
      e.preventDefault();
      this.props.onClick(this.props.key);
      return false;
    },

    render: function () {
      return (
        <li className={this.props.isActive ? 'active' : ''} onClick={this.onClick}>
          <a href='#'>
            {this.props.key}
          </a>
        </li>
      );
    },

  });



  var Header = React.createClass({

    isActive: function (value) { return this.props.active === value; },

    render: function () {
      var n = this.props.values.length
        , i = 0
        , value
        , lis = []
      ;
      while (i < n) {
        value = this.props.values[i];
        i += 1;
        lis.push(
          <Clickable key={value}
                     isActive={this.isActive(value)}
                     onClick={this.props.onSelect} />
        );
      }
      return (
        <th className='dropdown'>
          <a href='#' className='dropdown-toggle' data-toggle='dropdown'>
            {this.props.name}
          </a>
          <ul className='dropdown-menu'>{lis}</ul>
        </th>
      );
    },

  });



  var Table = React.createClass({

    getInitialState: function () {
      return {active: {}};
    },

    onSelect: function (key) {
      return function (value) {
        var active = this.state.active;
        if (active.hasOwnProperty(key)) {
          if (active[key] === value) {
            delete active[key];
          } else {
            active[key] = value;
          }
        } else {
          active[key] = value;
        }
        this.setState({active: active});
      }.bind(this);
    },

    render: function () {
      var active = this.state.active
        , shots = this.props.shots
        , n = shots.length
        , i = 0
        , shot
        , shouldSuppress = false
        , rows = []
      ;
      while (i < n) {
        shot = shots[i];
        i += 1;
        for (prop in active) {
          if (active.hasOwnProperty(prop) && active[prop] !== shot[prop]) {
            shouldSuppress = true;
          }
        }
        if (!shouldSuppress) {
          rows.push(
            <tr key={shot.id}>
              <td>{shot.date.toUTCString().slice(5, 16)}</td>
              <td>{shot.off_abbr}</td>
              <td>{shot.is_home ? '@' : '\u00A0'}</td>
              <td>{shot.def_abbr}</td>
              <td>{shot.shooter_name}</td>
              <td>{shot.details}</td>
              <td>{shot.point_value}</td>
              <td>{shot.is_make ? 'Made' : 'Missed'}</td>
            </tr>
          );
        } else {
          shouldSuppress = false;
        }
      }
      return (
        <div className='col-md-12'>
          <table className='table table-condensed table-hover'>
            <thead>
              <tr>
                <th>{'Date'}</th>
                <th>Team</th>
                <th>{'\u00A0'}</th>
                <Header name={'Oppt'}
                        values={oppts}
                        onSelect={this.onSelect('def_abbr')}
                        active={this.state.active.def_abbr} />
                <Header name={'Shooter'}
                        values={shooters}
                        onSelect={this.onSelect('shooter_name')}
                        active={this.state.active.shooter_name} />
                <th>Description</th>
                <th>Value</th>
                <th>Result</th>
              </tr>
            </thead>
            <tbody>
              {rows}
            </tbody>
          </table>
        </div>
      );
    },

  });



  var App = React.createClass({

    getInitialState: function () {
      return {
        filter: {},
      };
    },

    getPoints: function () {
      return Q(points).findAll(this.state.filter);
    },

    render: function () {
      var points = this.getPoints()
        , table = points.length > 0 ? <Table shots={points} rowsPerPage={20} /> : <table></table>
      ;
      return <Table shots={points} rowsPerPage={20} />;
    },

  });



  React.renderComponent(<App />, document.getElementById('app'));



}



$.ajax({
  url: BASE_URL + '/offense/NY',
  success: function (data) {
    run(data);
  },
});
