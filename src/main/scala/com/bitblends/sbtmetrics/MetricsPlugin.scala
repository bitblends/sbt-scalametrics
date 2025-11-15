/*
 * SPDX-FileCopyrightText: 2025 Benjamin Saff and contributors
 * SPDX-License-Identifier: MIT
 */

package com.bitblends.sbtmetrics

import com.bitblends.sbtmetrics.utils.ReportGenerator
import com.bitblends.scalametrics.ScalaMetrics
import com.bitblends.scalametrics.metrics.model.*
import com.bitblends.scalametrics.stats.model.ProjectStats
import com.bitblends.scalametrics.utils.{DialectConfig, Id as ProjectIdUtil}
import sbt.*
import sbt.Keys.*
import sbt.complete.DefaultParsers.*
import sbt.complete.Parser
import sbt.internal.util.ManagedLogger

import scala.meta.Dialect

/**
  * SBT Plugin for generating Scala source code metrics reports.
  *
  * This plugin provides tasks to analyze Scala source files in a project and generate metrics reports in various
  * formats. It supports command-line arguments for customizing the analysis, including dialect overrides, output file
  * names, exclusion patterns, and output formats.
  */
object MetricsPlugin extends AutoPlugin {

  // format: off
  // @formatter:off
  object autoImport {
    val metricsReport =
        inputKey[Unit]("Generate and print source code metrics report")
    val metricsReportAggregate =
        inputKey[Unit]("Generate aggregated metrics report for all modules in a multi-module project")
  }
  import autoImport.*
  // @formatter:on
  // format: on

  // Parser for command-line arguments
  private val dialectParser: Parser[(String, String)] = {
    (Space ~> (literal("--dialect") | literal("-d")) ~> Space ~> token(NotSpace, "<dialect>")).map(d =>
      ("dialect", d.trim)
    )
  }

  // Parser for command-line arguments
  private val outputParser: Parser[(String, String)] = {
    (Space ~> (literal("--output") | literal("-o")) ~> Space ~> token(NotSpace, "<output>")).map(o =>
      ("output", o.trim)
    )
  }

  // Parser for exclude paths (comma-separated)
  private val excludeParser: Parser[(String, String)] = {
    (Space ~> (literal("--exclude") | literal("-e")) ~> Space ~> token(NotSpace, "<paths>")).map(e =>
      ("exclude", e.trim)
    )
  }

  // Parser for json-only flag
  private val jsonOnlyParser: Parser[(String, String)] = {
    (Space ~> (literal("--json-only") | literal("-j"))).map(_ => ("json", "true"))
  }

  // Parser for csv-only flag
  private val csvOnlyParser: Parser[(String, String)] = {
    (Space ~> (literal("--csv-only") | literal("-c"))).map(_ => ("only-csv", "true"))
  }

  // Parser for generate-csv flag
  private val generateCsvParser: Parser[(String, String)] = {
    (Space ~> (literal("--generate-csv") | literal("-g"))).map(_ => ("csv", "true"))
  }

  // Parser for html-only flag
  private val htmlOnlyParser: Parser[(String, String)] = {
    (Space ~> (literal("--html-only") | literal("-l"))).map(_ => ("html", "true"))
  }

  // parser for data-only flag
  private val dataOnlyParser: Parser[(String, String)] = {
    (Space ~> (literal("--data-only") | literal("-a"))).map(_ => ("data", "true"))
  }

  // Parser for stdout-only flag
  private val stdoutOnlyParser: Parser[(String, String)] = {
    (Space ~> (literal("--stdout-only") | literal("-s"))).map(_ => ("stdout", "true"))
  }

  // Parser for help flag
  private val helpParser: Parser[(String, String)] = {
    (Space ~> (literal("--help") | literal("-h"))).map(_ => ("help", "true"))
  }

  // Combined argument parser
  private val argParser: Parser[(String, String)] =
    dialectParser | outputParser | excludeParser | stdoutOnlyParser | jsonOnlyParser | csvOnlyParser |
      generateCsvParser | htmlOnlyParser | dataOnlyParser | helpParser

  /**
    * Prints usage information for the metrics report commands
    */
  private def printUsage(log: ManagedLogger): Unit = {
    val availableDialects = DialectConfig.dialectMap.keys.toSeq.sorted.mkString(", ")
    log.info(
      s"""
         |Usage: sbt metricsReport [options]
         |       sbt metricsReportAggregate [options]
         |
         |Options:
         |  --help, -h              Show this help message
         |  --dialect, -d <dialect> Override Scala dialect for parsing
         |                          Available: $availableDialects
         |  --output, -o <name>     Custom output file name (without extension)
         |                          Default: 'metrics-report' or 'metrics-report-aggregate'
         |  --exclude, -e <paths>   Comma-separated list of paths/patterns to exclude
         |                          Example: --exclude target,test
         |  --stdout-only, -s       Print report to standard output only, no files generated
         |
         |Output Format Options (mutually exclusive):
         |  --json-only, -j         Generate JSON output file only
         |  --csv-only, -c          Generate CSV output file only
         |  --html-only, -l         Generate HTML report file only
         |  --data-only, -a         Generate data files only (JSON + Parquet)
         |  --generate-csv, -g      Include CSV file in addition to default output
         |
         |Examples:
         |  sbt metricsReport
         |  sbt metricsReport --dialect scala3
         |  sbt metricsReport --output my-report --exclude test,target
         |  sbt metricsReport --json-only
         |  sbt metricsReport --generate-csv
         |  sbt metricsReportAggregate --output aggregate-stats
         |""".stripMargin
    )
  }

  /**
    * Parser that converts command-line arguments into MetricsReportArgs
    */
  private val argsParser: Parser[MetricsReportArgs] = {
    argParser.*.map { args =>
      val argsMap      = args.toMap
      val excludePaths = argsMap
        .get("exclude")
        .map(_.split(",").map(_.trim).filter(_.nonEmpty).toList)
        .getOrElse(Nil)
      MetricsReportArgs(
        dialectOverride = argsMap.get("dialect"),
        outputName = argsMap.get("output"),
        excludePaths = excludePaths,
        jsonOnly = argsMap.contains("json"),
        generateCsv = argsMap.contains("csv"),
        csvOnly = argsMap.contains("only-csv"),
        htmlOnly = argsMap.contains("html"),
        dataOnly = argsMap.contains("data"),
        stdOutOnly = argsMap.contains("stdout"),
        showHelp = argsMap.contains("help")
      )
    }
  }

  /**
    * Helper function to check if a file should be excluded based on exclusion patterns
    */
  private def shouldExclude(file: File, excludePaths: List[String]): Boolean = {
    val filePath = file.getAbsolutePath
    excludePaths.exists { pattern =>
      // Support both exact match and contains match
      filePath.contains(pattern) || file.getName == pattern || file.getParentFile.getName == pattern
    }
  }

  /**
    * Helper function to analyze Scala files and return FileMetricsResult vector
    */
  private def analyzeScalaFiles(
      scalaFiles: Seq[File],
      projectBaseDir: File,
      projectInfo: ProjectInfo,
      dialectOverride: Option[Dialect],
      excludePaths: List[String]
  )(log: ManagedLogger): ProjectStats = {
    // Filter out excluded files
    val filteredFiles = if (excludePaths.nonEmpty) {
      val excluded = scalaFiles.filter(f => shouldExclude(f, excludePaths))
      if (excluded.nonEmpty) {
        log.info(s"Excluding ${excluded.size} file(s) based on --exclude patterns")
        excluded.foreach(f => log.debug(s"  Excluded: ${f.getPath}"))
      }
      scalaFiles.filterNot(f => shouldExclude(f, excludePaths))
    } else {
      scalaFiles
    }

    log.info(s"Analyzing ${filteredFiles.size} source file(s)...")

    ScalaMetrics.generateProjectStats(filteredFiles, projectBaseDir, projectInfo, dialectOverride)
  }

  /**
    * Validates that mutually exclusive output format flags are not used together
    */
  private def validateOutputFlags(args: MetricsReportArgs, log: ManagedLogger): Boolean = {
    val exclusiveFlags = Seq(
      ("--json-only", args.jsonOnly),
      ("--csv-only", args.csvOnly),
      ("--html-only", args.htmlOnly),
      ("--data-only", args.dataOnly),
      ("--generate-csv", args.generateCsv)
    ).filter(_._2)

    if (exclusiveFlags.size > 1) {
      val flagNames = exclusiveFlags.map(_._1).mkString(", ")
      log.error(s"Error: Cannot use multiple exclusive output format flags together: $flagNames")
      log.error("Please specify only one of: --json-only, --csv-only, --html-only, --data-only, --generate-csv")
      false
    } else {
      true
    }
  }

  /**
    * Project-level settings for the metrics report plugin
    */
  override lazy val projectSettings = Seq(
    metricsReport := {
      val log: ManagedLogger      = streams.value.log
      val projectBaseDir: File    = baseDirectory.value
      val args: MetricsReportArgs = argsParser.parsed

      // Check if help flag is set
      if (args.showHelp) {
        printUsage(log)
      } else if (!validateOutputFlags(args, log)) {
        // Validation failed, exit early
        sys.error("Invalid arguments: multiple exclusive output format flags specified")
      } else {
        // Validate and resolve dialect override if provided
        val dialectOverride: Option[Dialect] = args.dialectOverride.flatMap { dialectStr =>
          DialectConfig.dialectMap.get(dialectStr) match {
            case Some(dialect) =>
              log.info(s"Using dialect override: $dialectStr")
              Some(dialect)
            case None          =>
              log.warn(
                s"Unknown dialect: $dialectStr. Available dialects: ${
                                                                       DialectConfig.dialectMap.keys.toSeq.sorted.mkString(", ")
                                                                     }"
              )
              log.info("Analyzing files with per-file dialect detection...")
              None
          }
        }

        // Collect comprehensive project info
        log.info("Collecting project info...")
        val info: ProjectInfo = ProjectInfo(
          projectId = ProjectIdUtil.of(name.value),
          name = name.value,
          version = version.value,
          scalaVersion = scalaVersion.value,
          description = Option(description.value).filter(_.nonEmpty),
          crossScalaVersions = crossScalaVersions.value,
          organization = Option(organization.value).filter(_.nonEmpty),
          organizationName = Option(organizationName.value).filter(_.nonEmpty),
          organizationHomepage = organizationHomepage.value.map(_.toString).filter(_.nonEmpty),
          homepage = homepage.value.map(_.toString),
          licenses =
            if (licenses.value.isEmpty) None
            else Some(licenses.value.map { case (name, url) => s"$name ($url)" }.mkString(", ")),
          startYear = startYear.value.map(_.toString),
          isSnapshot = Some(isSnapshot.value.toString),
          apiURL = (Compile / doc / apiURL).value.map(_.toString),
          scmInfo = scmInfo.value.map { scm => s"${scm.browseUrl} (connection: ${scm.connection})" },
          developers = developers.value
            .map { dev =>
              val parts = List(
                Option(dev.email).filter(_.nonEmpty).map(e => s"email: $e"),
                Option(dev.url).map(_.toString).filter(_.nonEmpty).map(u => s"url: $u"),
                Option(dev.id).filter(_.nonEmpty).map(i => s"id: $i")
              ).flatten

              val info = parts.mkString(", ")

              if (info.nonEmpty) {
                if (dev.name.nonEmpty) s"${dev.name} ($info)" else info
              } else {
                if (dev.name.nonEmpty) dev.name else ""
              }
            },
          versionScheme = versionScheme.value,
          projectInfoNameFormal = Option(projectInfo.value.nameFormal).filter(_.nonEmpty)
        )

        log.info("Analyzing Scala source files...")
        val scalaFiles: Seq[File] = (Compile / sourceDirectories).value.flatMap { dir =>
          (dir ** "*.scala").get
        }

        if (scalaFiles.isEmpty)
          log.warn("No Scala source files found!")
        else
          log.info(s"Found ${scalaFiles.size} Scala source files")

        // Log exclusion patterns if provided
        if (args.excludePaths.nonEmpty) {
          log.info(s"Exclusion patterns: ${args.excludePaths.mkString(", ")}")
        }

        if (scalaFiles.nonEmpty) {
          // Analyze Scala files
          val projectStats =
            analyzeScalaFiles(scalaFiles, projectBaseDir, info, dialectOverride, args.excludePaths)(log)

          if (args.stdOutOnly)
            println(projectStats.formattedString)
          else {
            // Generate Report Files
            ReportGenerator.generateReport(
              target.value,
              projectStats,
              args.outputName,
              jsonOnly = args.jsonOnly,
              includeCsv = args.generateCsv,
              csvOnly = args.csvOnly,
              htmlOnly = args.htmlOnly,
              dataOnly = args.dataOnly
            )(log)
          }
        }
      }
    }
  )

  /**
    * Build-level settings for the aggregated metrics report plugin
    */
  override lazy val buildSettings = Seq(
    metricsReportAggregate / aggregate := false, // Don't aggregate across projects
    metricsReportAggregate             := Def.inputTask {
      val log: ManagedLogger      = streams.value.log
      val rootBaseDir: File       = (LocalRootProject / baseDirectory).value
      val args: MetricsReportArgs = argsParser.parsed
      val buildStruct             = (LocalRootProject / loadedBuild).value
      val currentState            = state.value

      // Check if help flag is set
      if (args.showHelp) {
        printUsage(log)
      } else if (!validateOutputFlags(args, log)) {
        // Validation failed, exit early
        sys.error("Invalid arguments: multiple exclusive output format flags specified")
      } else {
        log.info("=== Multi-Module Metrics Report ===")

        // Get all project references in this build
        val allProjectRefs: Seq[(ProjectRef, ResolvedProject)] = buildStruct.allProjectRefs
        log.info(s"Found ${allProjectRefs.size} module(s) in build: ${allProjectRefs.map(_._1.project).mkString(", ")}")

        // Validate and resolve dialect override if provided
        val dialectOverride: Option[Dialect] = args.dialectOverride.flatMap { dialectStr =>
          DialectConfig.dialectMap.get(dialectStr) match {
            case Some(dialect) =>
              log.info(s"Using dialect override: $dialectStr")
              Some(dialect)
            case None          =>
              log.warn(
                s"Unknown dialect: $dialectStr. Available dialects: ${
                                                                       DialectConfig.dialectMap.keys.toSeq.sorted.mkString(", ")
                                                                     }"
              )
              log.info("Analyzing files with per-file dialect detection...")
              None
          }
        }

        // Collect project info from root project
        log.info("Collecting aggregated project info from root...")
        val rootInfo: ProjectInfo = ProjectInfo(
          projectId = ProjectIdUtil.of((LocalRootProject / name).value),
          name = (LocalRootProject / name).value,
          version = (LocalRootProject / version).value,
          scalaVersion = (LocalRootProject / scalaVersion).value,
          description = Option((LocalRootProject / description).value).filter(_.nonEmpty),
          crossScalaVersions = (LocalRootProject / crossScalaVersions).value,
          organization = Option((LocalRootProject / organization).value).filter(_.nonEmpty),
          organizationName = Option((LocalRootProject / organizationName).value).filter(_.nonEmpty),
          organizationHomepage = (LocalRootProject / organizationHomepage).value.map(_.toString).filter(_.nonEmpty),
          homepage = (LocalRootProject / homepage).value.map(_.toString),
          licenses =
            if ((LocalRootProject / licenses).value.isEmpty) None
            else Some((LocalRootProject / licenses).value.map { case (name, url) => s"$name ($url)" }.mkString(", ")),
          startYear = (LocalRootProject / startYear).value.map(_.toString),
          isSnapshot = Some((LocalRootProject / isSnapshot).value.toString),
          apiURL = (LocalRootProject / Compile / doc / apiURL).value.map(_.toString),
          scmInfo =
            (LocalRootProject / scmInfo).value.map { scm => s"${scm.browseUrl} (connection: ${scm.connection})" },
          developers = (LocalRootProject / developers).value
            .map { dev =>
              val parts = List(
                Option(dev.email).filter(_.nonEmpty).map(e => s"email: $e"),
                Option(dev.url).map(_.toString).filter(_.nonEmpty).map(u => s"url: $u"),
                Option(dev.id).filter(_.nonEmpty).map(i => s"id: $i")
              ).flatten
              val info  = parts.mkString(", ")
              if (info.nonEmpty) {
                if (dev.name.nonEmpty) s"${dev.name} ($info)" else info
              } else {
                if (dev.name.nonEmpty) dev.name else ""
              }
            },
          versionScheme = (LocalRootProject / versionScheme).value,
          projectInfoNameFormal = Option((LocalRootProject / projectInfo).value.nameFormal).filter(_.nonEmpty)
        )

        // Log exclusion patterns if provided
        if (args.excludePaths.nonEmpty) {
          log.info(s"Exclusion patterns: ${args.excludePaths.mkString(", ")}")
        }

        // Collect Scala files from all modules using SBT's Project API
        log.info("Collecting Scala source files from all modules...")
        val allScalaFiles: Seq[File] = allProjectRefs.flatMap { case (projRef, resolvedProj) =>
          val moduleName = projRef.project

          // Check if this module should be excluded
          val moduleExcluded =
            args.excludePaths.exists(pattern => moduleName.contains(pattern) || moduleName == pattern)

          if (moduleExcluded) {
            log.info(s"  Module '$moduleName': excluded by pattern")
            Nil
          } else {
            // Use extracted API to evaluate sourceDirectories for each project
            val extracted        = Project.extract(currentState)
            val moduleSourceDirs = extracted.get(projRef / Compile / sourceDirectories)

            val moduleFiles = moduleSourceDirs.flatMap { dir =>
              (dir ** "*.scala").get
            }
            log.info(s"  Module '$moduleName': found ${moduleFiles.size} files")
            moduleFiles
          }
        }.distinct

        log.info(s"Total Scala files across all modules: ${allScalaFiles.size}")

        if (allScalaFiles.isEmpty) {
          log.warn("No Scala source files found in any module!")
        } else {
          // Analyze all Scala files
          val projectStats: ProjectStats =
            analyzeScalaFiles(allScalaFiles, rootBaseDir, rootInfo, dialectOverride, args.excludePaths)(log)

          if (args.stdOutOnly)
            println(projectStats.formattedString)
          else {
            // Generate aggregated report
            val outputName = args.outputName.getOrElse("metrics-report-aggregate")
            log.info(s"Generating aggregated report: $outputName")

            ReportGenerator.generateReport(
              (LocalRootProject / target).value,
              projectStats,
              Some(outputName),
              jsonOnly = args.jsonOnly,
              includeCsv = args.generateCsv,
              csvOnly = args.csvOnly,
              htmlOnly = args.htmlOnly,
              dataOnly = args.dataOnly
            )(log)
          }
        }
      }
    }.evaluated
  )

  /**
    * The trigger for this plugin to be automatically enabled in projects.
    */
  override def trigger = allRequirements

}
