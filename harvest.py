"""
Original created on Dec 16 2020
Edited on Jan 28 2021
    Converted GeoJSON into TopoJSON to reduce file size

@author: Yijing Zhou @YijingZhou33
"""

"""
    Part 0: Initialization
"""
##### Import necessary modules #######

# Note that mapclassify and topojson aren't built-in modules in Anaconda.
# You may need to install in advance.

# pip install mapclassify
# pip install topojson

import os
import pandas as pd
import json
import numpy as np
import re
from bs4 import BeautifulSoup, SoupStrainer
import requests
import geopandas as gpd
import folium
import sys
import mapclassify
import topojson as tp


####### Set file path #######

# ********** Input Files **********
# Raw data: CSV files
stategeoportals = os.path.join('data', 'allStates.csv')
countygeoportals = os.path.join('data', 'allCounties.csv')
citygeoportals = os.path.join('data', 'allCities.csv')

# Basemap GeoJSON files for states and counties
statejson = os.path.join('data', 'states.json')
countyjson = os.path.join('data', 'counties.json')

# ********** Output Files **********
activestates = os.path.join('json', 'activeStates.topo.json')
activecounties = os.path.join('json', 'activeCounties.topo.json')
activecities = os.path.join('json', 'activeCities.json')

legendjson = os.path.join('json', 'legend.json')


"""
    Part 1: State Geoportals TopoJSON
"""
####### Format state name in state geoportals spreadsheet allStates.csv #######
df_csv = pd.read_csv(stategeoportals)
df_csv['btaaURL'] = df_csv['btaaURL'].apply(lambda x: x.split('-')[0])


####### Etract total records number from BTAA Geoportal search page #######
def totalRecords(df):
    totalrecords = []
    for _, row in df.iterrows():
        url = row['btaaURL']
        # Start session and get the search page
        session = requests.Session()
        response = session.get(url)
        # Parse only part of the page (<meta> tag) for better performance using SoupStrainer and lxml
        strainer = SoupStrainer('meta', attrs={'name': 'totalResults'})
        soup = BeautifulSoup(response.content, 'lxml', parse_only=strainer)
        # The find() method looks through <meta> tag��s descendants and retrieves one result with attribute 'name'.
        meta_tag = soup.find('meta', attrs={'name': 'totalResults'})
        # Grab the content inside the <meta> tag that matches the filter
        totalrecord = meta_tag.get('content')
        totalrecords.append(totalrecord)
    return totalrecords


df_csv['totalRecords'] = totalRecords(df_csv)


####### Inspect the numinum number of total records #######

# If it equals to 0, meaning the landing page is 404 Not Found.
# Go back to check if the identifier is still active.
def check_totalRecords(df):
    df['totalRecords'] = df['totalRecords'].astype(int)
    if df['totalRecords'].min() == 0:
        return df[df['totalRecords'] == 0]
    else:
        print('> State Geoportal Codes all valid!')


check_totalRecords(df_csv)


####### Group dataframe rows into list by geoportal sites #######
def aggregate_to_array(data):
    groupItems = ['stateCode', 'Title', 'sourceURL']
    for i in range(len(groupItems)):
        data[groupItems[i]] = np.tile(
            [data[groupItems[i]].values], (data.shape[0], 1)).tolist()
    return data


# Group by ['State']
df_group = df_csv.groupby(['State']).apply(
    aggregate_to_array).drop_duplicates(subset=['State'])


####### Merge state GeoJSON and geoportal GeoJSON #######

# Load statejson featuer properties
state_geojson = gpd.read_file(statejson)
state_json = json.loads(state_geojson.to_json())
df_allState = pd.json_normalize(state_json['features'])

# Change column names for further operation
df_allState = df_allState[['properties.State', 'geometry.coordinates']].rename(
    columns={'properties.State': 'State', 'geometry.coordinates': 'boundingBox'})

# Join on column 'State' from left dataframe df_group
df_merge = pd.merge(df_group, df_allState, on='State', how='left')


####### Return rows with Nan value #######

# Check if there exists any records doesn't include any coordinates information in the boundingBox column
# If so, go back to allCounties.csv and manually change the county name to the one in county.json
def check_nanrows(df):
    if df.isnull().values.any():
        print(df[df['boundingBox'].isnull()])
        sys.exit()
    else:
        print('> No NULL rows')


check_nanrows(df_merge)


####### Create state GeoJSON features #######
def create_geojson_features(df):
    print('> Creating state GeoJSON features...')
    features = []
    geometry_type = ''
    geojson = {
        'type': 'FeatureCollection',
        'features': features
    }

    for _, row in df.iterrows():
        if type(row['boundingBox'][0][0][0]) is float:
            geometry_type = 'Polygon'
        else:
            geometry_type = 'MultiPolygon'

        feature = {
            'type': 'Feature',
            'geometry': {
                'type': geometry_type,
                'coordinates': row['boundingBox']
            },
            'properties': {
                'State': row['State'],
                'Title': '|'.join([str(elem) for elem in row['Title']]),
                'sourceURL': '|'.join([str(elem) for elem in row['sourceURL']]),
                'btaaURL': row['btaaURL'],
                'totalRecords': row['totalRecords']
            }
        }

        features.append(feature)
    return geojson


data_geojson = create_geojson_features(df_merge)


####### Write to state TopoJSON file activeStates.topo.json #######
state_geojson = gpd.GeoDataFrame.from_features(data_geojson["features"])

# TopoJSON is an extension of GeoJSON to compress geometry information
topo = tp.Topology(state_geojson)
topo.to_json(activestates)
print('> Creating state TopoJSON file...')


"""
    Part 2: County Geoportals GeoJSON
"""
####### Format county name in county geoportals spreadsheet allCounties.csv #######
df_csv = pd.read_csv(countygeoportals)

# Replace 'Saint' and 'St' with 'St.'
df_csv['County'] = df_csv['County'].apply(
    lambda x: re.sub(r'(Saint\s|^St\s|^St\.\s)', 'St. ', x))

# Replace 'Baltimore County' and 'Baltimore' with 'Baltimore County County'
df_csv['County'] = df_csv['County'].apply(lambda x: re.sub(
    r'(^(Baltimore|Baltimore\sCounty)$)', 'Baltimore County County', x))


####### Etract total records number from BTAA Geoportal search page #######
df_csv['totalRecords'] = totalRecords(df_csv)


####### Inspect the numinum number of total records #######
check_totalRecords(df_csv)


####### Group dataframe rows into list by geoportal sites #######
def aggregate_to_array(data):
    groupItems = ['Title', 'sourceURL', 'totalRecords']
    for i in range(len(groupItems)):
        data[groupItems[i]] = np.tile(
            [data[groupItems[i]].values], (data.shape[0], 1)).tolist()
    return data


# Group by ['County', 'State']
df_group = df_csv.groupby(['County', 'State']).apply(
    aggregate_to_array).drop_duplicates(subset=['County', 'State'])
# Sum up the total records if there're multiple geoportals in one county
df_group['totalRecords'] = df_group['totalRecords'].apply(
    lambda x: sum(int(item)for item in x))


####### Classify the geoportal by total number #######

# You may want to adjust the classification method Quantiles and class number k.
n5 = mapclassify.Quantiles(df_group.totalRecords, k=5)
countyInterval = list(n5.bins)


####### Assign different color to each geoportal based on total records class #######

# Select the gradient color palette
palette = ['#b3cde0', '#6497b1', '#005b96', '#03396c ', '#011f4b']


def totalRecords_color(row):
    if row['totalRecords'] <= countyInterval[0]:
        return palette[0]
    elif row['totalRecords'] > countyInterval[0] and row['totalRecords'] <= countyInterval[1]:
        return palette[1]
    elif row['totalRecords'] > countyInterval[1] and row['totalRecords'] <= countyInterval[2]:
        return palette[2]
    elif row['totalRecords'] > countyInterval[2] and row['totalRecords'] <= countyInterval[3]:
        return palette[3]
    else:
        return palette[4]


# Append a new column with color generated above
df_group['Color'] = df_group.apply(totalRecords_color, axis=1)


####### Merge county GeoJSON and geoportal GeoJSON #######

# Load countyjson featuer properties
county_geojson = gpd.read_file(countyjson)
county_json = json.loads(county_geojson.to_json())
df_allCounty = pd.json_normalize(county_json['features'])

# Change column names for further operation
df_allCounty = df_allCounty[['properties.County', 'properties.State', 'geometry.coordinates']].rename(
    columns={'properties.County': 'County', 'properties.State': 'State', 'geometry.coordinates': 'boundingBox'})

# Join on column 'County' and 'State' from left dataframe df_group
df_merge = pd.merge(df_group, df_allCounty, on=['County', 'State'], how='left')


####### Return rows with Nan value #######

# Check if there exists any records doesn't include any coordinates information in the boundingBox column
# If so, go back to allCounties.csv and manually change the county name to the one in county.json
def check_nanrows(df):
    if df.isnull().values.any():
        print(df[df['boundingBox'].isnull()])
        sys.exit()
    else:
        print('> No NULL rows')


check_nanrows(df_merge)


####### Create county GeoJSON features #######
def create_geojson_features(df):
    print('> Creating county GeoJSON features...')
    features = []
    geometry_type = ''
    geojson = {
        'type': 'FeatureCollection',
        'features': features
    }

    for _, row in df.iterrows():
        if type(row['boundingBox'][0][0][0]) is float:
            geometry_type = 'Polygon'
        else:
            geometry_type = 'MultiPolygon'

        feature = {
            'type': 'Feature',
            'geometry': {
                'type': geometry_type,
                'coordinates': row['boundingBox']
            },
            'properties': {
                'County': row['County'],
                'State': row['State'],
                'countyCode': row['countyCode'],
                'Title': '|'.join([str(elem) for elem in row['Title']]),
                'sourceURL': '|'.join([str(elem) for elem in row['sourceURL']]),
                'btaaURL': row['btaaURL'],
                'totalRecords': row['totalRecords'],
                'Color' : row['Color']
            }
        }

        features.append(feature)
    return geojson


data_geojson = create_geojson_features(df_merge)


####### Write to county TopoJSON file activeCounties.topo.json #######
county_geojson = gpd.GeoDataFrame.from_features(data_geojson["features"])

# TopoJSON is an extension of GeoJSON to compress geometry information
topo = tp.Topology(county_geojson)
topo.to_json(activecounties)
print('> Creating county TopoJSON file...')


"""
    Part 3: City Geoportals GeoJSON
"""
####### Format city name in city geoportals spreadsheet allCities.csv #######
df = pd.read_csv(citygeoportals)
# Calculate city coordinates and round to 2 decimal places
df = pd.concat([df, df['Bounding Box'].str.split(',', expand=True).astype(float)], axis=1).rename(
    columns={0: 'minX', 1: 'minY', 2: 'maxX', 3: 'maxY'})
df['centerX'] = round((df['minX'] + df['maxX']) / 2, 2)
df['centerY'] = round((df['minY'] + df['maxY']) / 2, 2)
df_clean = df.drop(columns=['minX', 'minY', 'maxX', 'maxY', 'Bounding Box'])


####### Etract total records number from BTAA Geoportal search page #######
df_clean['totalRecords'] = totalRecords(df_clean)


####### Inspect the numinum number of total records #######
check_totalRecords(df_clean)

####### Group dataframe rows into list by geoportal sites #######
def aggregate_to_array(data):
    groupItems = ['Title', 'sourceURL', 'totalRecords']
    for i in range(len(groupItems)):
        data[groupItems[i]] = np.tile(
            [data[groupItems[i]].values], (data.shape[0], 1)).tolist()
    return data

# Group by ['City', 'State']
df_group = df_clean.groupby(['centerX']).apply(
    aggregate_to_array).drop_duplicates(subset=['City', 'State'])
# sum up the total records if there're multiple geoportals in one city
df_group['totalRecords'] = df_group['totalRecords'].apply(
    lambda x: sum(int(item)for item in x))


####### Classify the geoportal by total number #######

# You may want to adjust the classification method Quantiles and class number k.
n3 = mapclassify.Quantiles(df_group.totalRecords, k=3)
cityInterval = list(n3.bins)

####### Assign different circle radius to each geoportal based on total records class #######

# Size of symbols on map in meters
size = [12000, 16000, 22000]
# Size of symbols inside legend in pixels
legendSize = [12, 18, 28]


def totalRecords_size(row):
    if row['totalRecords'] <= cityInterval[0]:
        return size[0]
    elif row['totalRecords'] > cityInterval[0] and row['totalRecords'] <= cityInterval[1]:
        return size[1]
    else:
        return size[2]


# Append a new column with color generated above
df_group['Size'] = df_group.apply(totalRecords_size, axis=1)


####### Create city GeoJSON features #######
def create_geojson_features(df):
    print('> Creating city GeoJSON features...')
    features = []
    geojson = {
        'type': 'FeatureCollection',
        'features': features
    }
    for _, row in df.iterrows():
        feature = {
            'type': 'Feature',
            'geometry': {
                'type': 'Point',
                'coordinates': [row['centerX'], row['centerY']]
            },
            'properties': {
                'City': row['City'],
                'State': row['State'],
                'Title': '|'.join([str(elem) for elem in row['Title']]),
                'sourceURL': '|'.join([str(elem) for elem in row['sourceURL']]),
                'btaaURL': row['btaaURL'],
                'totalRecords': row['totalRecords'],
                'Size' : row['Size']
            }
        }

        features.append(feature)
    return geojson


data_geojson = create_geojson_features(df_group)


####### Write to city GeoJSON file activecities.json #######
with open(activecities, 'w') as txtfile:
    json.dump(data_geojson, txtfile)
print('> Creating city GeoJSON file...')


"""
    Part 4: Legend JSON
"""
####### Create legend JSON features #######


def create_legend_json(countyinterval, palette, cityinterval, size):
    print('> Creating legend JSON featuers...')
    countystyle = dict(zip(countyinterval, palette))
    citystyle = dict(zip(cityinterval, size))
    dic = {
        'county': countystyle,
        'city': citystyle
    }
    return dic


data_json = create_legend_json(
    countyInterval, palette, cityInterval, legendSize)


####### Write to legend JSON file legend.json #######
with open(legendjson, 'w') as txtfile:
    json.dump(data_json, txtfile)
print('> Creating legend JSON file...')
