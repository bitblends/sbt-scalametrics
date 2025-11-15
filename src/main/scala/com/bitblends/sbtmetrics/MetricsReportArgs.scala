/*
 * SPDX-FileCopyrightText: 2025 Benjamin Saff and contributors
 * SPDX-License-Identifier: MIT
 */

package com.bitblends.sbtmetrics

/**
  * Encapsulates arguments related to generating a metrics report, including options for output naming, dialect
  * overrides, and exclusion of specific paths from the analysis. It holds parsed command-line arguments.
  *
  * @param dialectOverride
  *   An optional string to override the default parser dialect. Useful for specifying custom dialects such as Scala
  *   versions or compatible syntaxes during analysis.
  * @param outputName
  *   An optional name for the output report file. This allows customization of the generated report's file name.
  * @param excludePaths
  *   A list of file system paths to exclude from the metrics analysis. Useful for ignoring files or directories that
  *   are not relevant to the analysis process.
  * @param jsonOnly
  *   A boolean flag indicating whether to generate only a JSON report.
  * @param generateCsv
  *   A boolean flag indicating whether to generate a CSV report in addition to other formats.
  * @param csvOnly
  *   A boolean flag indicating whether to generate only a CSV report.
  * @param htmlOnly
  *   A boolean flag indicating whether to generate only an HTML report.
  * @param dataOnly
  *   A boolean flag indicating whether to output only the raw data without any formatted reports.
  * @param stdOutOnly
  *   A boolean flag indicating whether to print the report directly to standard output instead of writing to files.
  * @param showHelp
  *   A boolean flag indicating whether to show the help message instead of running the report.
  */
case class MetricsReportArgs(
    dialectOverride: Option[String] = None,
    outputName: Option[String] = None,
    excludePaths: List[String] = Nil,
    jsonOnly: Boolean = false,
    generateCsv: Boolean = false,
    csvOnly: Boolean = false,
    htmlOnly: Boolean = false,
    dataOnly: Boolean = false,
    stdOutOnly: Boolean = false,
    showHelp: Boolean = false
)
