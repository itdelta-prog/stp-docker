from dotenv import load_dotenv
import os
load_dotenv()

class Config(object):
    SECRET_KEY = os.getenv('FLASK_APP_KEY', 'you-will-never-guess')
    SCOPES = list(map(lambda x: x.strip(), os.getenv('SCOPES', '').split(' , ')))