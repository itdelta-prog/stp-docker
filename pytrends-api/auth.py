import os.path
from flask import Flask, request, jsonify, redirect, session


from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
import sys
import config
from init import app

def creds():
    creds = None
  # The file token.json stores the user's access and refresh tokens, and is
  # created automatically when the authorization flow completes for the first
  # time.
    if os.path.exists("token.json"):
        creds = Credentials.from_authorized_user_file("token.json", app.config['SCOPES'])
  # If there are no (valid) credentials available, let the user log in.
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            pass
        
        if creds is not None:
            with open("token.json", "w") as token:
                token.write(creds.to_json())

    return creds

def login():
    flow = Flow.from_client_secrets_file(
        "credentials.json",
        scopes=app.config['SCOPES'],
        redirect_uri="http://localhost:8181/trends/callback"
    )

    auth_url, state = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true",
        prompt="consent"
    )

    # Сохраняем code_verifier для последующего fetch_token
    code_verifiers = session.get('code_verifier', {})
    code_verifiers[state] = flow.code_verifier
    session['code_verifiers'] = code_verifiers
    return auth_url


def callback():
    state = request.args.get("state")
    flow = Flow.from_client_secrets_file(
        "credentials.json",
        scopes=app.config['SCOPES'],
        state=state,
        redirect_uri="http://localhost:8181/trends/callback"
    )
    # Важно: передаем сохраненный code_verifier
    code_verifiers = session.get('code_verifiers', {})
    code_verifier = code_verifiers.get(state)
    
    if code_verifier is None:
        raise Exception("Chýba code_verifier")
    
    flow.code_verifier = code_verifier

    flow.fetch_token(authorization_response=request.url)
    creds = flow.credentials

    with open("token.json", "w") as f:
        f.write(creds.to_json())