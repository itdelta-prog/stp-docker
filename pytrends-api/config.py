from dotenv import load_dotenv
import os
load_dotenv()

class Config(object):
    SECRET_KEY = os.getenv('FLASK_APP_KEY', 'you-will-never-guess')
    SCOPES = list(map(lambda x: x.strip(), os.getenv('SCOPES', '').split(' , ')))
    PLANNER_URL = os.getenv('PLANNER_URL', 'http://localhost:8181/planner')
    CALLBACK_URL = os.getenv('CALLBACK_URL', 'http://localhost:8000/callback')