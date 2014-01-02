from flask.ext.script import Manager, Server
from shot_chart import app

manager = Manager(app)
server = Server(use_debugger=True, use_reloader=True)

manager.add_command('runserver', server)

if __name__ == '__main__':
    manager.run()
