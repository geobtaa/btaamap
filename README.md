# Mapping Available City, County and State Geodata in the Big Ten Academic Alliance Region
The primary purpose of this interactive map is to show what states, counties and cities [BTAA Geoportal](https://geo.btaa.org/) is pulling data from. The Python scripts are used to keep track of open data portals along with the number of total records and transform metadata file formats between CSV and JSON. 

*<a href="https://btaa-geospatial-data-project.github.io/btaamap/">Live Demo</a>*

#### How to use

1. Edit `allStates.csv`, `allCities.csv` and `allCounties.csv` 
2. Run Python Scripts to produce `activeStates.topo.json`, `activeCounties.topo.json`, `activeCities.json`and `legend.json`
3. Push new changes to GitHub



## Environment Setup

We We will be using **Anaconda 3** to edit and run scripts. Information on Anaconda installation can be found [here](https://docs.anaconda.com/anaconda/install/).  All packages available for 64-bit Windows with Python 3.7 in the Anaconda can be found [here](https://docs.anaconda.com/anaconda/packages/py3.7_win-64/). Please note that all scripts are running on Python 3 (**3.7.6**).

Here are all dependencies needed to be installed properly: 

- [geopandas](https://geopandas.org/getting_started/install.html) [Version: 0.7.0]
- [shapely](https://pypi.org/project/Shapely/) [Version: 1.7.0]
- [requests](https://requests.readthedocs.io/en/master/user/install/#install) [Version: 2.22.0]
- [numpy](https://numpy.org/install/) [Version: 1.18.1]

- [folium](https://python-visualization.github.io/folium/) [Version: 0.10.1]
- [mapclassify](https://github.com/pysal/mapclassify) [Version: 2.4.2]
- [seaborn](https://seaborn.pydata.org) [Version: 0.10.0]
- [topojson](https://github.com/mattijn/topojson) [Version: 1.0]



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



