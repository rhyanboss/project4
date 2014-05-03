from google.appengine.ext import db
"""
class Story(db.Model):
  title = db.StringProperty()
  body = db.TextProperty()
  created = db.DateTimeProperty(auto_now_add=True)
  """
  

class Player(db.Model):
  name = db.StringProperty()
  
  def send_message(self,channel,data):
    channel.send_message(self.name,data)
  