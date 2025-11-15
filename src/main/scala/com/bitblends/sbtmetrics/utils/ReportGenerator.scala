/*
 * SPDX-FileCopyrightText: 2025 Benjamin Saff and contributors
 * SPDX-License-Identifier: MIT
 */

package com.bitblends.sbtmetrics.utils

import com.bitblends.sbtmetrics.csv.Csv
import com.bitblends.scalametrics.stats.model.{
  FileStats,
  FileStatsMetadata,
  MemberStats,
  MethodStats,
  PackageStats,
  ProjectMetadata,
  ProjectStats
}
import sbt.File
import sbt.internal.util.ManagedLogger

import java.io.{ByteArrayOutputStream, PrintWriter}
import java.util.Base64
import java.util.zip.GZIPOutputStream
import scala.io.Source

/**
  * An object responsible for generating reports based on project statistics. It provides functionality to create HTML
  * and JSON reports, compress JavaScript content, and write files to the specified target directory.
  */
object ReportGenerator {

  /**
    * Generates reports based on the provided project statistics and writes them to the specified target directory.
    *
    * @param targetDir
    *   The directory where the reports will be saved.
    * @param projectStats
    *   The statistics of the project to be included in the reports.
    * @param outputBaseNameMaybe
    *   An optional base name for the output files. If not provided, a default name will be used.
    * @param jsonOnly
    *   A flag indicating whether to generate only the JSON report.
    * @param includeCsv
    *   A flag indicating whether to include CSV report along with HTML and JSON.
    * @param csvOnly
    *   A flag indicating whether to generate only the CSV report.
    * @param htmlOnly
    *   A flag indicating whether to generate only the HTML report.
    * @param dataOnly
    *   A flag indicating whether to generate only data files (JSON and/or CSV) without HTML.
    * @param log
    *   A logger for logging messages during report generation.
    */
  def generateReport(
      targetDir: File,
      projectStats: ProjectStats,
      outputBaseNameMaybe: Option[String],
      jsonOnly: Boolean = false,
      includeCsv: Boolean = false,
      csvOnly: Boolean = false,
      htmlOnly: Boolean = false,
      dataOnly: Boolean = false
  )(
      log: ManagedLogger
  ): Unit = {

    val default     = !csvOnly && !dataOnly && !jsonOnly && !htmlOnly
    val csvEnabled  = (csvOnly || dataOnly || includeCsv) && !htmlOnly
    val jsonEnabled = ((jsonOnly || dataOnly) && !htmlOnly) || default
    val htmlEnabled = (!csvOnly || !dataOnly || !jsonOnly) && default || htmlOnly

    val outputBaseName     = outputBaseNameMaybe.getOrElse("metrics-report")
    if (outputBaseNameMaybe.isDefined) {
      log.info(s"Using custom output name: $outputBaseName")
    }
    val reportsDir         = new File(targetDir, outputBaseName)
    if (!reportsDir.exists()) {
      reportsDir.mkdirs()
    }
    // Determine output file name based on --output argument
    val outputFileBaseName =
      if (outputBaseName.endsWith(".html")) outputBaseName.replace(".html", "")
      else outputBaseName

    val htmlReportFile = new File(reportsDir, outputFileBaseName + ".html")
    val jsonContent    = projectStats.toJson

    // Generate JSON file
    if (jsonEnabled) {
      val jsonFile = new File(reportsDir, outputFileBaseName + "-data.json")

      // Save JSON file to the target directory
      writeToFile(jsonFile, jsonContent)
      log.info(s"JSON data file generated: ${jsonFile.getAbsolutePath}")
    }

    // Generate CSV
    if (csvEnabled) {
      // Generate CSV only
      val csvFiles = generateCsv(reportsDir, projectStats, outputFileBaseName)
      csvFiles match {
        case (fileStatsFile, memberStatsFile, methodStatsFile) =>
          log.info(s"File stats CSV generated: ${fileStatsFile.getAbsolutePath}")
          log.info(s"Member stats CSV generated: ${memberStatsFile.getAbsolutePath}")
          log.info(s"Method stats CSV generated: ${methodStatsFile.getAbsolutePath}")
      }
    }

    if (htmlEnabled) {
      // Generate JS content from JSON content and compress it with GZIP
      val compressedJs = generateCompressedJsContent(jsonContent)(log)

      // Generate HTML, inject JS content into the template
      val htmlContent = generateHtml(compressedJs)

      // Save HTML file to the target directory
      writeToFile(htmlReportFile, htmlContent)
      log.info(s"HTML report generated: ${htmlReportFile.getAbsolutePath}")
    }
  }

  /**
    * Generates CSV files for the given project data and writes it to the specified reports directory.
    *
    * @param reportsDir
    *   The directory where the CSV file will be written.
    * @param project
    *   The project whose data will be serialized into a CSV format. The project contains a collection of packages that
    *   form the input data for the CSV.
    * @param baseFileName
    *   The base name for the output CSV file. This name will be used to create the full file name with ".csv"
    *   extension.
    * @return
    *   This method returns no value but writes the generated CSV content to the specified file.
    */
  private def generateCsv(reportsDir: File, project: ProjectStats, baseFileName: String): (File, File, File) = {
    val memberStatsFile = new File(reportsDir, baseFileName + "-members.csv")
    val methodStatsFile = new File(reportsDir, baseFileName + "-methods.csv")
    val fileStatsFile   = new File(reportsDir, baseFileName + "-files.csv")
    Csv.writeTable[MemberStats](
      rows = project.packageStats.flatMap(_.fileStats.flatMap(_.memberStats)),
      path = memberStatsFile.toPath
    )
    Csv.writeTable[MethodStats](
      rows = project.packageStats.flatMap(_.fileStats.flatMap(_.methodStats)),
      path = methodStatsFile.toPath
    )
    Csv.writeTable[FileStatsMetadata](
      rows = project.packageStats.flatMap(_.fileStats.map(_.metadata)),
      path = fileStatsFile.toPath
    )
    Csv.writeTable[ProjectMetadata](
      rows = Seq(project.metadata),
      path = fileStatsFile.toPath
    )
    (fileStatsFile, memberStatsFile, methodStatsFile)
  }

  /**
    * Writes the specified content to the provided file.
    *
    * @param file
    *   The file to which the content will be written.
    * @param content
    *   The string content to be written into the file.
    * @return
    *   This method does not return a value.
    */
  private def writeToFile(file: File, content: String): Unit = {
    val writer = new PrintWriter(file)
    try {
      writer.write(content)
    } finally {
      writer.close()
    }
  }

  /**
    * Generates a compressed JavaScript content by first creating a JavaScript variable from the provided JSON content,
    * attempting to minify it using a JS minifier, and, if minification fails, falling back to the original content.
    * Finally, the resulting JavaScript content is compressed using GZIP and encoded in Base64 format.
    *
    * @param jsonContent
    *   The JSON content to be incorporated into the JavaScript variable.
    * @param log
    *   A logger to record warnings or messages during the execution of the method.
    * @return
    *   The compressed and Base64-encoded JavaScript content.
    */
  private def generateCompressedJsContent(jsonContent: String)(log: ManagedLogger) = {
    val jsContent  = s"const metricsData = $jsonContent;"
    // Try to minify, but fall back to unminified if closure compiler isn't available
    val minifiedJs =
      try {
        JsMinifier.minifyJsString(jsContent)
      } catch {
        case _: NoClassDefFoundError | _: ClassNotFoundException =>
          // Closure compiler not available, use unminified
          log.warn(
            "Warning: Closure compiler not available, using unminified JS"
          )
          jsContent
      }

    // Compress the JS content with GZIP and encode as Base64
    compressToBase64(minifiedJs)
  }

  /**
    * Compresses the given string using GZIP compression and encodes the result into a Base64 string.
    *
    * @param data
    *   The input string to be compressed and encoded.
    * @return
    *   A Base64-encoded string representing the compressed data.
    */
  private def compressToBase64(data: String): String = {
    val baos    = new ByteArrayOutputStream()
    val gzipOut = new GZIPOutputStream(baos)
    try {
      gzipOut.write(data.getBytes("UTF-8"))
      gzipOut.finish()
    } finally {
      gzipOut.close()
    }
    Base64.getEncoder.encodeToString(baos.toByteArray)
  }

  /**
    * Generates an HTML string by injecting JavaScript content and data into an HTML template.
    *
    * @param jsData
    *   A string containing JavaScript data to be embedded in the HTML template.
    * @return
    *   A string representing the final HTML content with placeholders replaced.
    */
  private def generateHtml(jsData: String): String = {
    val template  = loadResourceAsString("/metrics-report-template.html")
    val jsContent = loadResourceAsString("/metrics-report.js")

    // First replace the JavaScript content placeholder
    val withJs = template.replace("{{METRICS_JS_CONTENT}}", jsContent)

    // Then replace the data placeholder
    withJs.replace("{{METRICS_DATA_JS}}", jsData)

  }

  /**
    * Loads the content of a resource file located at the specified path as a string.
    *
    * @param resourcePath
    *   The path to the resource file to be loaded.
    * @return
    *   A string containing the content of the resource file.
    * @throws RuntimeException
    *   If the resource file is not found at the specified path.
    */
  private def loadResourceAsString(resourcePath: String): String = {
    val resourceStream = getClass.getResourceAsStream(resourcePath)
    if (resourceStream == null) {
      throw new RuntimeException(
        s"Resource file not found: $resourcePath"
      )
    }
    val source         = Source.fromInputStream(resourceStream)
    try {
      source.mkString
    } finally {
      source.close()
    }
  }
}
