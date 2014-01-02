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



from flask import Response

@blueprint.route('/team/<team>')
def fetch_by_team(team):
    cur = get_db()
    cur = cur.execute('SELECT json FROM shots WHERE team = ?', (team,))
    results = [result[0] for result in cur.fetchall()]
    cur.close()
    json_string = '[' + ', '.join(results) + ']'
    return Response(json_string, mimetype='application/json')
