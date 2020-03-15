# COVID-19   

## Background  

Inspired by [CSSEGISandData/COVID-19](https://github.com/CSSEGISandData/COVID-19) which publicly open the data of COVID-19 cases across the world, but the data is in a raw format which makes the community hard to parse or use the data programmatically, this project will provide an infrastructure that host the parsed data (JSON format) and make it available for the community for various type of purposes  

This project also aims to provide reliable information or data related to COVID-19 by collecting or aggregating information or data from reliable and trusted sources and make it publicly available and easy to consume programmatically to support the creativity of the community to develop or build an application related to COVID-19  

## API Documentation 

```ruby
base_url: "https://mq-covid-19-update.s3.ap-southeast-1.amazonaws.com"
```

### Case Index by Date

#### Request

```ruby
url: "{base_ur}/api/data.json"
method: "GET"
```

#### Response

| Attribute  | Description                                                  |
| ---------- | ------------------------------------------------------------ |
| items      | **Index Items**                                              |
| scraped_at | Timestamp when the data is scraped from the source, <br />Example: `2020-03-15T05:08:05.072Z` |

**Index Items**

| Attribute  | Description                                   |
| ---------- | --------------------------------------------- |
| date       | Date of the data                              |
| name       | Title of the data                             |
| detail     | API path to see the detail of the data        |
| file_name  | Data source file name                         |
| updated_at | Timestamp when the data souce update the data |

### Case Detail by Date

#### Request

```ruby
url: "{base_ur}/api/data/{YYYY-MM-DD}.json"
method: "GET"
```

#### Response

| Attribute  | Description                                                  |
| ---------- | ------------------------------------------------------------ |
| items      | **Detail Items**                                             |
| scraped_at | Timestamp when the data is scraped from the source, <br />Example: `2020-03-15T05:08:05.072Z` |
| updated_at | Timestamp when the data souce update the data                |

Detail Items

| Attribute      | Description                     |
| -------------- | ------------------------------- |
| province_state | Name of province or state       |
| country_region | Name of country or region       |
| confirmed      | Total number of confirmed cases |
| deaths         | Total number of deaths cases    |
| recovered      | Total number of recovered cases |

## Data Source
- [github.com/CSSEGISandData/COVID-19](https://github.com/CSSEGISandData/COVID-19)