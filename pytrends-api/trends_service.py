from flask import Flask, request, jsonify
from pytrends.request import TrendReq
from pytrends.exceptions import TooManyRequestsError
import time

def get_trends(keywords_list, data):
    
    results = [{"date": str(index.date()), "interest": dict(row)} for index, row in data.iterrows()]
    
    data = {
        'keywords_list': keywords_list,
        'interest': results
    }

    return data

def build_payload(pytrends, q):
    keywords_list = list(map(lambda x: x.strip(), q.split(',')))
    pytrends.build_payload(keywords_list, timeframe='today 5-y', geo='CZ')
    time.sleep(1)  # menšia pauza
    return pytrends.interest_over_time(), keywords_list