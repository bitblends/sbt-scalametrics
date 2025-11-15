---
title: Getting Started
description: Learn how to install and use ScalaMetrics for comprehensive code metrics and analysis in your Scala projects.
keywords: [ Sby ScalaMetrics, getting started, installation, code metrics, Scala, static analysis ]
layout: doc
hide: [ title ]
---

# Getting Started

## Usage

Add the plugin to your project's `project/plugins.sbt`:

``` scala
addSbtPlugin("com.bitblends" % "sbt-scalametrics" % "{{ project_version }}")
```

## Quick Start

### For Flat Projects or Per-Module Analysis

``` bash 
# Run without arguments (automatically detects Scala dialect)
sbt metricsReport
```

### For Multi-Module Projects

``` bash
# Aggregates all metrics from all modules (automatically detects Scala dialect), 
# works for both multi-module and single-module (flat) projects
sbt metricsReportAggregate
```

### Additional Options

You can provide additional options to customize the report generation.

#### Dialect Override

``` bash
# Dialect Override
sbt "metricsReport --dialect Scala3"
# Similarly for multi-module projects
sbt "metricsReportAggregate --dialect Scala213"
   
# Works with other formats as well
sbt "metricsReport --dialect Scala33"
sbt "metricsReport --dialect scala213"
sbt "metricsReport --dialect 2.13"
```

#### Custom Output File Name

``` bash
# Specify custom output HTML report file name (without extension)
sbt "metricsReport --output my-metrics-report"
sbt "metricsReportAggregate --output full-project-metrics"
```

#### Exclude Source Directories or Modules

``` bash
# Exclude specific source directories/modules
sbt "metricsReport --exclude examples,benchmark"
sbt "metricsReportAggregate --exclude examples,benchmark"

# Exclude by path pattern
sbt "metricsReport --exclude /examples/,/benchmark/"
sbt "metricsReportAggregate --exclude /examples/,/benchmark/"
```

#### Only Generate JSON File

You can choose to generate only the JSON file without HTML report.

``` bash
# Generate only JSON file
sbt "metricsReport --json-only"
sbt "metricsReportAggregate --json-only"
```

#### Generate CSV Files

You can choose to generate CSV files in addition to the default HTML and JSON files.

``` bash
# Generate CSV files along with HTML and JSON
sbt "metricsReport --generate-csv"
sbt "metricsReportAggregate --generate-csv"
```

You can also only generate CSV files without HTML and JSON files.

``` bash
# Generate only CSV files
sbt "metricsReport --csv-only"
sbt "metricsReportAggregate --csv-only"
```

#### Only Generate HTML Report

You can choose to generate only the HTML report without JSON and CSV files.

```bash
# Generate only HTML report
sbt "metricsReport --html-only"
sbt "metricsReportAggregate --html-only"
```

#### Only Generate Data Files

You can choose to generate only the data files (JSON and CSV) without the HTML report.

``` bash
# Generate only data files (JSON and/or CSV)
sbt "metricsReport --data-only"
sbt "metricsReportAggregate --data-only"
```

#### Print Report to Stdout

You can print the project-level report to stdout only without generating any files.

``` bash
# Print report to stdout only, without generating files
sbt "metricsReport --stdout-only"
sbt "metricsReportAggregate --stdout-only"
```

#### Combine Options

It is possible to combine multiple options together as needed.

``` bash
sbt "metricsReport --stdout-only --dialect Scala212"
sbt "metricsReport --dialect Scala213 --output custom-report --exclude examples,benchmark"
sbt "metricsReportAggregate --dialect Scala3 --output full-metrics --exclude /examples/,/benchmark/"
```

<!-- @formatter:off -->
!!! tip
    The HTML report is provided for convenience. It enables a quick viewing of key metrics of the project. You can build
    your own dashboards by using the generated JSON or CSV files.
<!-- @formatter:on -->

### Results

A `metrics-report` (or `metrics-report-aggregate` or `<your-custom-output>`) directory is generated inside the project's
`./target/` directory with the following files:

- An interactive HTML report file: `metrics-report.html`
- Raw data JSON file: `metrics-report-data.json`
- Raw data CSV files: `metrics-report-files.csv`, `metrics-report-members.csv`, and `metrics-report-methods.csv`

    ``` text
    my-scala-project/
    ├── project/
    │   └── ...
    ├── src/
    │   └── ...
    ├── target/
    │   ├── ...
    │   └── metrics-report/
    │       ├── metrics-report.html
    │       ├── metrics-report-data.json  
    │       ├── metrics-report-files.csv  
    │       ├── metrics-report-members.csv  
    │       └── metrics-report-methods.csv
    ├── ...
    └── build.sbt
    ```