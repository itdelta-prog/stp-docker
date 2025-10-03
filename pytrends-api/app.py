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
from datetime import datetime

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
        return redirect(app.config('LOGIN_URL'))
    # get query parameters
    q = request.args.get('q')
    customer_id = request.args.get('customer_id', '5872432115')
    
    if not q:
        return jsonify({"error": "Chýba parameter q"}), 400
    try:
        _, keywords_list = trends_service.build_payload(pytrends=pytrends, q=q)
    except TooManyRequestsError:
        app.logger.error("Príliš veľa požiadaviek na Google, skúste neskôr")

    keywords_list = list(map(lambda x: x.strip(), q.split(',')))
    
    
    # get data from php google ads planner 
    planner_data = {}
    if customer_id:
        planner_url = f"{app.config['PLANNER_URL']}/historical-metrics/{customer_id}"
        try:
            print(planner_url, file=sys.stderr)
            response = requests.get(planner_url, params={'keywords': q})
            if response.status_code != 200:
                app.logger.error("Chyba pri získavaní dát z Google Ads Planner: " + response.text)
            planner_data = response.json()
            print(planner_data, file=sys.stderr)
        except requests.exceptions.RequestException as e:
            app.logger.error("Chyba pri získavaní dát z Google Ads Planner: " + str(e))
    
    trends = {}
    try:
        trends, keywords_list = trends_service.build_payload(pytrends=pytrends, q=q)
    except TooManyRequestsError:
        app.logger.error("Príliš veľa požiadaviek na Google, skúste neskôr")
    if len(trends) == 0:
        app.logger.error("Nenašli sa žiadne dáta")
    else:
        trends = trends_service.get_trends(keywords_list=keywords_list, data=trends)
        
    data = {
        'trends': trends,
        'planner': planner_data,
    }

    used_services = [
        'trends' if 'trends' in data and data['trends'] and len(data['trends']) > 0 else None,
        'planner' if 'planner' in data and data['planner'] and len(data['planner']) > 0 else None,
    ]
    used_services = list(filter(lambda x: x is not None, used_services))
    used_services_str = '-'.join(used_services) if len(used_services) > 0 else 'no-services'
    date = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    google_sheets_service.save(data, title=f"sevices-{used_services_str}-kwords-{q}-date-{date}", pos={'x':1, 'y':1})

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
