import os.path

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from flask import redirect
import sys
import config
import auth

import google.auth
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from openpyxl.utils import get_column_letter

def cell_name(col_num, row_num):
    return f"{get_column_letter(col_num)}{row_num}"

def update_values(spreadsheet_id, range_name, value_input_option, _values):
  """
  Creates the batch_update the user has access to.
  Load pre-authorized user credentials from the environment.
  TODO(developer) - See https://developers.google.com/identity
  for guides on implementing OAuth2 for the application.
  """
  creds = auth.creds()
  # pylint: disable=maybe-no-member
  try:
    service = build("sheets", "v4", credentials=creds)
    values = _values
    body = {"values": values}
    result = (
        service.spreadsheets()
        .values()
        .update(
            spreadsheetId=spreadsheet_id,
            range=range_name,
            valueInputOption=value_input_option,
            body=body,
        )
        .execute()
    )
    print(f"{result.get('updatedCells')} cells updated.")
    return result
  except HttpError as error:
    print(f"An error occurred: {error}")
    return error


if __name__ == "__main__":
  # Pass: spreadsheet_id,  range_name, value_input_option and  _values
  update_values(
      "1CM29gwKIzeXsAppeNwrc8lbYaVMmUclprLuLYuHog4k",
      "A1:C2",
      "USER_ENTERED",
      [["A", "B"], ["C", "D"]],
  )

def get_values(spreadsheet_id, range_name):
  """
  Creates the batch_update the user has access to.
  Load pre-authorized user credentials from the environment.
  TODO(developer) - See https://developers.google.com/identity
  for guides on implementing OAuth2 for the application.
  """
  creds = auth.creds()
  # pylint: disable=maybe-no-member
  try:
    service = build("sheets", "v4", credentials=creds)

    result = (
        service.spreadsheets()
        .values()
        .get(spreadsheetId=spreadsheet_id, range=range_name)
        .execute()
    )
    rows = result.get("values", [])
    print(f"{len(rows)} rows retrieved")
    return result
  except HttpError as error:
    print(f"An error occurred: {error}")
    return error


def create(title):
  """
  Creates the Sheet the user has access to.
  Load pre-authorized user credentials from the environment.
  TODO(developer) - See https://developers.google.com/identity
  for guides on implementing OAuth2 for the application.
  """
  creds = auth.creds()
  # pylint: disable=maybe-no-member
  try:
    service = build("sheets", "v4", credentials=creds)
    spreadsheet = {"properties": {"title": title}}
    spreadsheet = (
        service.spreadsheets()
        .create(body=spreadsheet, fields="spreadsheetId")
        .execute()
    )
    print(f"Spreadsheet ID: {(spreadsheet.get('spreadsheetId'))}")
    return spreadsheet.get("spreadsheetId")
  except HttpError as error:
    print(f"An error occurred: {error}")
    return error
  
def planner_in_sheet(spreadsheetId, data, pos={'x':1, 'y':1}, offset_y=0):
  planner = data['planner']
  planner_headers = [
    "search_query",
    "search_query_variants",
    "approximate_avg_monthly_searches",
    "competition_level",
    "competition_index",
    "percentile_20th",
    "percentile_80th"
  ]
  planner_row = [
    planner.get("search_query", ""),
    planner.get("search_query_variants", ""),
    planner.get("approximate_avg_monthly_searches", ""),
    planner.get("competition_level", ""),
    planner.get("competition_index", ""),
    planner.get("percentile_20th", ""),
    planner.get("percentile_80th", "")
  ]
  first_cell = cell_name(pos['x'], pos['y'] + offset_y + 3)  # чуть ниже trends
  last_cell = cell_name(pos['x'] + len(planner_headers) - 1, pos['y'] + offset_y + 4)
  planner_cell_range = f"{first_cell}:{last_cell}"
  update_values(
      spreadsheet_id=spreadsheetId,
      range_name=planner_cell_range,
      value_input_option="USER_ENTERED",
      _values=[planner_headers, planner_row]
  )
  # Теперь monthly_search_volumes_data (отдельная таблица ниже)
  monthly_data = planner.get("monthly_search_volumes_data", [])
  if monthly_data:
      monthly_headers = ["month_of_year", "year", "monthly_search_volume"]
      monthly_rows = [
          [m["month_of_year"], m["year"], m["monthly_search_volume"]]
          for m in monthly_data
      ]
      monthly_table = [monthly_headers] + monthly_rows
      first_cell = cell_name(pos['x'], pos['y'] + offset_y + 6)  
      last_cell = cell_name(pos['x'] + len(monthly_headers) - 1, pos['y'] + offset_y + 6 + len(monthly_rows))
      monthly_cell_range = f"{first_cell}:{last_cell}"
      update_values(
          spreadsheet_id=spreadsheetId,
          range_name=monthly_cell_range,
          value_input_option="USER_ENTERED",
          _values=monthly_table
      )


def trends_in_sheet(spreadsheetId, data, pos={'x':1, 'y':1}):
      # trends part
    trends = data['trends']['interest']
    keywords_list = data['trends']['keywords_list']
    columns_trend = ['dates']
    columns_trend.extend(keywords_list)
    trends_count = len(trends)
    
    trends_data = [columns_trend]
    for t in trends:
      row = [t['date']]
      for col in keywords_list:
        row.append(t['interest'][col])
      
      trends_data.append(row)
    first_cell = cell_name(pos['x'], pos['y'])
    last_cell = cell_name(len(columns_trend), trends_count + 1)
    trends_cell_range = f"{first_cell}:{last_cell}"
    
    print(trends_cell_range, file=sys.stderr)
    update_values(spreadsheet_id=spreadsheetId, range_name=trends_cell_range, value_input_option="USER_ENTERED", _values=trends_data)
    return trends_count

def save(data, title="spreadsheet", pos={'x':1, 'y':1}):
  try:
    spreadsheetId = create(title)
  except HttpError:
    pass

  if not spreadsheetId:
    print("Chyba pri vytváraní spreadsheetu", file=sys.stderr)
    return
  offset_y = 0
  if 'trends' in data.keys() and data['trends'] is not None and len(data['trends']) > 0:
    offset_y += trends_in_sheet(spreadsheetId, data, pos=pos)
  # planner part
  if 'planner' in data.keys() and data['planner'] is not None and len(data['planner']) > 0:
    planner_in_sheet(spreadsheetId, data, pos=pos, offset_y=offset_y)