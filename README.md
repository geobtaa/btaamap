# Mapping Available City, County and State Geodata in the Big Ten Academic Alliance Region
The primary purpose of this interactive map is to show what states, counties and cities [BTAA Geoportal](https://geo.btaa.org/) is pulling data from. The Python scripts are used to keep track of open data portals along with the number of total records and transform metadata file formats between CSV and JSON. 

*<a href="https://btaa-geospatial-data-project.github.io/btaamap/">Live Demo</a>*

#### How to use

1. Edit `allStates.csv`, `allCities.csv` and `allCounties.csv` 
2. Run Python Scripts to produce `activeStates.topo.json`, `activeCounties.topo.json`, `activeCities.json`and `legend.json`
3. Push new changes to GitHub

## What is TopoJSON?

**<a href='https://github.com/topojson/topojson'>TopoJSON</a>** is an extension of GeoJSON storing geometry information more efficiently. Here are some main differences:

1. If features share the same border, TopoJSON will eliminate the redundancy and only display the boundary once. 
2. Implementing ***arc***, shared line segment, to compress geometry properties and
3. Quantizing delta-encoding for integer coordinates

## Data folder

- ### CSV files - *allCities.csv & allCounties.csv & allStates.csv* 

  These spreadsheets (<a href="https://docs.google.com/spreadsheets/d/1LgSkQpP_Xy5_Rz-Qm8PWvCISv8fYbM5RptRleFaD-4Q/edit#gid=1072617325">Google Drive</a>) require regular maintenance. The schema borrows many fields from <a href="https://github.com/geoblacklight/geoblacklight/wiki/GeoBlacklight-1.0-Metadata-Elements">GeoBlacklight Metadata Elements, Version 1.0</a>. The main difference is that  ***allCities.csv*** includes `bounding Box` used to calculate the coordinates of city position. 

- ### JSON - *counties.json & states.json* 

  It is formatted as GeoJSON to encode geographic data structures for all states and counties in the Big Ten Academic Alliance Region.  

## Python Scripts

- ### harvest.ipynb [recommended]

  This script should be opened with Anaconda3 Jupyter Notebook (running on Python 3). It will produce 4 json files stored in **json folder**. Reference comments for further explanation. 

  ​	**1. activeCities.json**

  ​	**2. activeCounties.topo.json**
  
  ​	**3. activeStates.topo.json**

  ​	**4. legend.json**

- ### harvest.py



