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
from init import app

pytrends = TrendReq(hl='cs-CZ', tz=60)

@app.route('/')
def home():
    return "API je v poriadku, použite /trends?q=sluchátka"
@app.route("/login")
def login():
    return redirect(auth.login())

@app.route("/callback")
def callback():
    try:
        auth.callback()
    except Exception as e:
        return jsonify({"error": "Chýba parameter" + str(e)}), 400
    return redirect("/")

@app.route('/sheet')
def save_in_sheet():
    if auth.creds() is None: 
        return redirect('/login')
    # get query parameters
    q = request.args.get('q')
    
    if not q:
        return jsonify({"error": "Chýba parameter q"}), 400
    _, keywords_list = trends_service.build_payload(pytrends=pytrends, q=q)

    # get data from php google ads planner 
    # some logic
    # some logic

    # get data from trends
    try:
        trends, keywords_list = trends_service.build_payload(pytrends=pytrends, q=q)
    except TooManyRequestsError:
        return jsonify({"error": "Príliš veľa požiadaviek na Google, skúste neskôr"}), 429
    if trends.empty:
        return jsonify({"error": "Nenašli sa žiadne dáta"}), 404
    trends = trends_service.get_trends(keywords_list=keywords_list, data=trends)
    
    data = {
        'trends': trends,
        'keyword-planner-data': {}
    }

    google_sheets_service.save(data)
    return "API je v poriadku, použite /trends?q=sluchátka"


@app.route('/trends')
def trends():
    q = request.args.get('q')
    
    if not q:
        return jsonify({"error": "Chýba parameter q"}), 400


    try:
        data, keywords_list = trends_service.build_payload(pytrends=pytrends, q=q)
    except TooManyRequestsError:
        return jsonify({"error": "Príliš veľa požiadaviek na Google, skúste neskôr"}), 429
    
    if data.empty:
        return jsonify({"error": "Nenašli sa žiadne dáta"}), 404

    data = trends_service.get_trends(keywords_list=keywords_list, data=data)

    return jsonify(data)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=True)
