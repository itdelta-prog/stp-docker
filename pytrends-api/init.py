from flask import Flask, request, jsonify, redirect, session
from pytrends.request import TrendReq
from pytrends.exceptions import TooManyRequestsError
import time
import sys
import trends_service
import google_sheets_service
import auth
from google_auth_oauthlib.flow import Flow
import os 
import config
import requests
import logging

os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'

app = Flask(__name__)
app.logger.setLevel(logging.ERROR)


app.config.from_object('config.Config')

if app.secret_key is None:
    print("Chýba kľúč pre Flask aplikáciu. Nastavte premennú prostredia FLASK_APP_KEY.")
    sys.exit(1)
