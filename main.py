"""`main` is the top level module for your Flask application."""
import json
from google.appengine.api import channel
from google.appengine.api import users
from google.appengine.ext import db
from  google.appengine.ext.db import Key
# Import the Flask Framework
from flask import Flask
from flask import render_template
from flask import request
app = Flask(__name__)
# Note: We don't need to call run() since our application is embedded within
# the App Engine WSGI application server.

class Player(db.Model):
  name = db.StringProperty()
  online = db.BooleanProperty();
  def send_message(self,channel,data):
    channel.send_message(self.name,data)

@app.errorhandler(404)
def page_not_found(e):
    """Return a custom 404 error."""
    return 'Sorry, Nothing at this URL.', 404

@app.route('/',methods=['POST','GET'])
def me(name=None):
    """Return a friendly HTTP greeting."""
    #return render_template('cards.html',name=name)
    """user = users.get_current_user()
    if user:
      token = channel.create_channel(user.user_id())
      player = Player(name=user.user_id())
      player.put()
      return render_template('cards.html',token=token)
    else:
      greeting = ('<a href="%s">Sign in or register</a>.' % users.create_login_url('/'))
      return '<html><body>%s</body></html>'%greeting"""
    
    """token = ""
    if request.method == 'POST':
      player_id= json.loads(request.form['data'])["player_id"]
      player = Player.get_by_key_name (player_id) 
      if(player):
        player.send_message(channel,str(player.name))
      return "" """
    if request.method == 'POST':
      post = json.loads(request.form['data'])
      player_id = post["player_id"]
      this_player = Player.get_by_key_name(player_id)
      players = Player.all()
      message = {"addNetWorkPlayer":{ "id":player_id,
                                      "name":this_player.name
                                    }
                 }
      str_message = json.dumps(message)
      for player in players:
          player.send_message(channel,str_message)
      return ""
    else:
      players=Player.all();
      player_id = "player-%s"%players.count();
      token = channel.create_channel(player_id)
      player = Player(key_name=player_id,name=player_id)
      player.put()      
      return render_template('cards.html',token=token,player_id=player_id)
    return ""
    
@app.route('/network-mode',methods=['POST'])
def network():
  if request.method == 'POST':
      post = json.loads(request.form['data'])
      player_id = post["player_id"]
      this_player = Player.get_by_key_name(player_id)
      players = Player.all()
      message = {"addNetWorkPayer":{ "id":player_id,
                                      "name":ths_player.name
                                    }
                 }
      str_message = json.dumps(message)
      for player in players:
          player.send_message(channel,str_message)
      return ""

    
  
  