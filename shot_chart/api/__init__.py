from flask import Blueprint
blueprint = Blueprint('api', __name__)



import sqlite3
from flask import g

DATABASE = '/Users/Jared/Documents/github/naismith/naismith/shots.db'

def get_db():
    db = getattr(g, '_db', None)
    if db is None:
        db = g._db = sqlite3.connect(DATABASE)
    return db



from flask import Response, jsonify

@blueprint.route('/teams')
def fetch_teams():
    cur = get_db()
    results = cur.execute('SELECT * FROM teams ORDER BY abbr').fetchall()
    cur.close()
    keys = ('locating', 'nickname', 'abbr',
            'stats_inc_id', 'conference', 'division',)
    return jsonify({'teams': [dict(zip(keys, result)) for result in results]})

@blueprint.route('/shots/team/<team>')
def fetch_team(team):
    cur = get_db()
    cur = cur.execute('SELECT json FROM shots WHERE team_abbr = ?', (team,))
    results = [result[0] for result in cur.fetchall()]
    cur.close()
    json_string = '[' + ', '.join(results) + ']'
    return Response(json_string, mimetype='application/json')

@blueprint.route('/shots/shooter/<shooter>')
def fetch_shooter(shooter):
    cur = get_db()
    cur = cur.execute(
        'SELECT json FROM shots WHERE shooter_name = ?', (shooter,))
    results = [result[0] for result in cur.fetchall()]
    cur.close()
    json_string = '[' + ', '.join(results) + ']'
    return Response(json_string, mimetype='application/json')
