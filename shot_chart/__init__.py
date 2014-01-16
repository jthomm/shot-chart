from flask import Flask
app = Flask(__name__)



import api
app.register_blueprint(api.blueprint, url_prefix='/api')

import frontend
app.register_blueprint(frontend.blueprint, url_prefix='/shot-chart')



from flask.ext.assets import Environment, Bundle

assets = Environment(app)

assets.register('css', Bundle('court.css',
                              'react-spinner/react-spinner.css',
                              Bundle('bootstrap/custom/bootstrap.less',
                                     depends=['bootstrap/custom/*.less'],
                                     filters='less'),
                              Bundle('fontawesome/custom/font-awesome.less',
                                     depends=['fontawesome/custom/*.less'],
                                     filters='less'),
                              output='bundle.css'))

assets.register('js', Bundle('jquery-1.10.2.js',
                             Bundle('bootstrap/current/js/transition.js',
                                    'bootstrap/current/js/alert.js',
                                    'bootstrap/current/js/button.js',
                                    'bootstrap/current/js/carousel.js',
                                    'bootstrap/current/js/collapse.js',
                                    'bootstrap/current/js/dropdown.js',
                                    'bootstrap/current/js/modal.js',
                                    'bootstrap/current/js/scrollspy.js',
                                    'bootstrap/current/js/tab.js',
                                    'bootstrap/current/js/tooltip.js',
                                    'bootstrap/current/js/popover.js',
                                    'bootstrap/current/js/affix.js'),
                             'typeahead.js/typeahead.js',
                             'simple-statistics/src/simple_statistics.js',
                             'smartmatch.js',
                             'quarry.js',
                             'binning.js',
                             'react-spinner/react-spinner.js',
                             #'app.js',
                             output='bundle.js'))
