/*
 * SPDX-FileCopyrightText: 2025 Benjamin Saff and contributors
 * SPDX-License-Identifier: MIT
 */

package com.bitblends.sbtmetrics.csv

import com.bitblends.sbtmetrics.csv.AutoHeader.*
import com.bitblends.scalametrics.stats.model.Serializer

/**
  * Utility object for writing CSV files from sequences of serializable objects.
  */
object Csv {

  /**
    * Writes a sequence of serializable objects to a CSV file at the specified path.
    *
    * @param rows
    *   The sequence of objects to write to the CSV file.
    * @param path
    *   The file path where the CSV file will be written.
    * @param extraCols
    *   Additional columns to include in the CSV, specified as pairs of column name and a function to extract the value.
    * @param collapseNestedPrefixes
    *   Whether to collapse nested prefixes in the headers.
    * @param aliasOnCollapseByPrefix
    *   A mapping for aliasing collapsed prefixes in the headers.
    * @param headerTOverride
    *   An optional override for the header transformation function.
    * @tparam T
    *   The type of objects being serialized, which must extend the Serializer trait.
    * @return
    *   Unit
    */
  def writeTable[T <: Serializer](
      rows: Seq[T],
      path: java.nio.file.Path,
      extraCols: Seq[(String, T => String)] = Seq.empty,
      collapseNestedPrefixes: Boolean = true,
      aliasOnCollapseByPrefix: Map[String, Map[String, String]] = Map.empty,
      headerTOverride: Option[HeaderT.T] = None
  ): Unit = if (rows.nonEmpty) {
    val sample    = rows.head
    val computedT = headerTOverride.getOrElse(
      defaultTransform(
        sample,
        collapseNestedPrefixes = collapseNestedPrefixes,
        aliasOnCollapseByPrefix = aliasOnCollapseByPrefix
      )
    )

    val allKeys = sample.csvHeaders()
    val w       = writer(path)
    try {
      val transformed: Vector[(String, String)] =
        allKeys.flatMap(k => computedT(k).map(k2 => k -> k2))

      val headers = transformed.map(_._2) ++ extraCols.map(_._1)
      w.write(headers.mkString(",")); w.newLine()

      rows.foreach { r =>
        val flat   = r.toFlatVector().toMap
        val values =
          transformed.map { case (orig, _) => Serializer.valueToCsv(flat.getOrElse(orig, "")) } ++
            extraCols.map { case (_, f) => Serializer.valueToCsv(f(r)) }
        w.write(values.mkString(",")); w.newLine()
      }
    } finally w.close()
  }

  /**
    * Creates a buffered writer for the specified file path, ensuring that the parent directories exist.
    *
    * @param path
    *   The file path where the writer will write data.
    *
    * @return
    *   A buffered writer for the specified file path.
    */
  private def writer(path: java.nio.file.Path) = {
    val p = path.getParent
    if (p != null && !java.nio.file.Files.exists(p)) java.nio.file.Files.createDirectories(p)
    java.nio.file.Files.newBufferedWriter(path, java.nio.charset.StandardCharsets.UTF_8)
  }

}
