/*
 * SPDX-FileCopyrightText: 2025 Benjamin Saff and contributors
 * SPDX-License-Identifier: MIT
 */

package com.bitblends.sbtmetrics.csv
import com.bitblends.scalametrics.stats.model.Serializer

/**
  * Utility object for automatically generating CSV headers by collapsing nested prefixes in serialized objects.
  */
object AutoHeader {

  /**
    * Identify top-level keys in the sample whose values are nested structures (Serializer, Product, Map, or Iterable of
    * Products).
    *
    * @param sample
    *   A sample Serializer instance to analyze.
    * @return
    *   A set of top-level keys that correspond to nested structures.
    */
  def nestedTopLevelKeys(sample: Serializer): Set[String] = {
    val lm = sample.toListMap
    lm.collect {
      case (k, _: Serializer)                                                  => k
      case (k, v: Product)                                                     => k
      case (k, _: Map[_, _])                                                   => k
      case (k, v: Iterable[_]) if v.headOption.exists(_.isInstanceOf[Product]) => k
    }.toSet
  }

  /**
    * Collapse all specified prefixes in the keys, applying optional aliasing for collapsed names.
    *
    * @param prefixes
    *   A sequence of prefixes to collapse.
    * @param aliasOnCollapseByPrefix
    *   A mapping of prefixes to their corresponding alias mappings for collapsed names.
    * @return
    *   A header transformation function that collapses the specified prefixes and applies aliasing.
    */
  private def collapseAllPrefixesSafe(
      prefixes: Seq[String],
      aliasOnCollapseByPrefix: Map[String, Map[String, String]]
  ): HeaderT.T = { key =>
    prefixes.collectFirst {
      case p if key.startsWith(p + ".") =>
        val collapsed = key.substring(p.length + 1)
        val aliased   = aliasOnCollapseByPrefix.get(p).flatMap(_.get(collapsed)).getOrElse(collapsed)
        aliased
    } match {
      case Some(name) => Some(name)
      case None       => Some(key)
    }
  }

  /**
    * Generates a default header transformation function that collapses nested prefixes in the keys of a serialized
    * object. If collapsing a prefix results in name collisions, the original dotted keys are retained for those
    * entries.
    *
    * @param sample
    *   A sample Serializer instance to analyze for nested prefixes.
    * @param collapseNestedPrefixes
    *   A flag indicating whether to collapse nested prefixes.
    * @param aliasOnCollapseByPrefix
    *   A mapping of prefixes to their corresponding alias mappings for collapsed names.
    * @return
    *   A header transformation function that collapses nested prefixes and handles name collisions.
    */
  def defaultTransform(
      sample: Serializer,
      collapseNestedPrefixes: Boolean = true,
      aliasOnCollapseByPrefix: Map[String, Map[String, String]] = Map.empty
  ): HeaderT.T = {
    val baseKeys = sample.csvHeaders()
    val prefixes = if (collapseNestedPrefixes) nestedTopLevelKeys(sample).toSeq.sorted else Seq.empty

    if (prefixes.isEmpty)
      HeaderT.identity
    else {
      // One pass to compute proposed final names for each original key
      val t: HeaderT.T = collapseAllPrefixesSafe(prefixes, aliasOnCollapseByPrefix)

      val proposed: Vector[(String, String)] = baseKeys.map { orig =>
        val finalName = t(orig).getOrElse(orig) // safe: our T never returns None
        (orig, finalName)
      }

      // Count how many orig keys map to the same final name
      val counts: Map[String, Int] =
        proposed.groupBy(_._2).map { case (name, pairs) => name -> pairs.size }

      // Final transform: if a collapsed name collides (>1), keep the original dotted key.
      { key: String =>
        val finalName = proposed.find(_._1 == key).map(_._2).getOrElse(key)
        if (counts.getOrElse(finalName, 0) > 1) Some(key) else Some(finalName)
      }
    }
  }
}
