---
title: Sbt ScalaMetrics
description: A plugin to for analyzing and generating reports of code metrics for Scala projects.
keywords: [ Sbt, ScalaMetrics, Sbt ScalaMetrics, code metrics, static analysis, Scala, cyclomatic complexity, code quality, ScalaMeta ]
layout: doc
toc: true
---

<style>
  .md-typeset h1,
  .md-content__button {
    display: none;
  }
</style>

<!-- @formatter:off -->
<!-- format: off -->
<div class="header-logo" markdown="1"> 

![Logo](images/logo_light.png#only-light){ width="36" }
![Logo](images/logo.png#only-dark){ width="36" }

<span style="font-size: 36pt; font-weight: bold; padding-left: 6pt;">Sbt ScalaMetrics</span>
</div>
<div markdown class="badges">

 [![Release](https://img.shields.io/github/v/release/bitblends/sbt-scalametrics?sort=semver&style=flat&color=darkgreen&labelColor=2f363d&logo=github&logoColor=white)](https://github.com/bitblends/sbt-scalametrics/releases/latest){:target="_blank"}
 [![Maven Central](https://img.shields.io/maven-central/v/com.bitblends/sbt-scalametrics_2.12_1.0?style=flat&color=darkgreen&labelColor=2f363d&logo=Sonatype&logoColor=white)](https://central.sonatype.com/artifact/com.bitblends/sbt-scalametrics_2.12_1.0){:target="_blank",style="margin-right: 10px;"}
 [![CI](https://github.com/bitblends/sbt-scalametrics/actions/workflows/ci.yml/badge.svg)](https://github.com/bitblends/sbt-scalametrics/actions/workflows/ci.yml){:target="_blank"}
 [![License](https://img.shields.io/badge/License-MIT-3?style=flat&color=yellow&labelColor=2f363d&logoColor=white)](LICENSE){:target="_blank"}

</div>
<p markdown>

[Sbt ScalaMetrics](https://github.com/bitblends/sbt-scalametrics){:target="_blank"} is an Sbt plugin
for [ScalaMetrics](https://github.com/bitblends/scalametrics){:target="_blank"} library. It's a convenient way to
analyze and generate reports of code metrics for Scala projects. It provides comprehensive analysis at multiple
granularity levels: project, package, file, methods/members and generates a detailed single HTML report file
with [Tailwind CSS](https://tailwindcss.com/){:target="_blank"} styling and interactive [d3.js](https://d3js.org/){:target="_blank"} 
charts and raw JSON and CSV data files. Learn more about ScalaMetrics library by visiting
the [ScalaMetrics Documentation](https://bitblends.github.io/scalametrics/){:target="_blank"} site.

</p>
<!-- format: on -->
<!-- @formatter:on -->

## Features

- **Multi-Level Analysis**: Extract metrics at project, package, file, method, and member levels
- **Comprehensive Metrics**:
	- Cyclomatic complexity
	- Nesting depth
	- Expression branch density
	- Pattern matching
	- Lines of code
	- Documentation coverage
	- Parameter and arity (implicit, using, default, varargs)
	- Return type explicitness
	- Inline and implicit usage
- **Multi-module Support**: Works seamlessly with multi-module SBT projects
- **Multiple Dialect Support**: Supports Scala 2.12.x, 2.13.x, and 3.3.x
- **Automatic Dialect Detection**: Automatically detects Scala dialects for accurate parsing using a combination of
  heuristics and statistical methods

<!-- format: off -->
<!-- @formatter:off -->
Please refer to the [Getting Started][getting-started] guide for instructions and quick start examples.
You can also explore the [Metrics Overview](https://bitblends.github.io/scalametrics/metrics-overview/){:target="_blank"} 
page of ScalaMetrics library to learn more about the various metrics provided by this library.
<!-- format: on -->
<!-- @formatter:on -->

## Contributing

Contributions are welcome! Please see [CONTRIBUTING](CONTRIBUTING.md) for guidelines.

## License

Licensed under the MIT License. See [LICENSE](LICENSE.md){add_header Content-Disposition inline; } file for details.

