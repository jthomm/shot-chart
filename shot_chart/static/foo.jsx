  function makePoints(area, data) {
    var n = data.length
      , i = 0
      , datum
      , bin
      , point
      , points = []
    ;
    while (i < n) {
      datum = data[i];
      i += 1;
      point = asPoint.call(datum);
      point.area = area;
      bin = point.getBin();
      point.bin = {
        x: bin.getX(),
        y: bin.getY(),
      };
      points.push(point);
    }
    return points;
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
  }

  function getHexAttrs(x, y, shots, area, radiusScaler, colorScaler) {

    var fga = shots.length
      , transform = 'translate(' + x + ',' + y + ')'

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
      shot = shots[i];
      i += 1;
      if (shot.event_desc === 'Field Goal Made') {
        pts += shot.point_value;
      }
    }

    efgPct = pts/fga;
    fill = colorScaler(efgPct);
    stroke = d3.rgb(fill).darker();

    return {
      fga: fga,
      transform: transform,
      vertices: vertices,
      efgPct: efgPct,
      style: {
        fill: fill,
      },
      stroke: stroke,
    };

  }



ShotChart = react.createClass({

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
         transform={bin.transform}
         vertices={bin.vertices}
         efgPct={bin.efgPct}
         style={bin.style}
         stroke={bin.stroke}
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
