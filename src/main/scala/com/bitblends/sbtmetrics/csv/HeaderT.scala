/*
 * SPDX-FileCopyrightText: 2025 Benjamin Saff and contributors
 * SPDX-License-Identifier: MIT
 */

package com.bitblends.sbtmetrics.csv

/**
  * Utilities for transforming CSV header keys.
  */
object HeaderT {

  /**
    * A header transform: original dotted key -> Some(finalName) or None to drop.
    */
  type T = String => Option[String]

  /**
    * Identity transform: keep all keys unchanged.
    */
  val identity: T = Some(_)

  /**
    * Drop columns whose key starts with any of these prefixes (prefix match is 'p.' or exact 'p').
    */
  def dropPrefixes(prefixes: String*): T = { key =>
    val drop = prefixes.exists { p =>
      key == p || key.startsWith(p + ".")
    }
    if (drop) None else Some(key)
  }

  /**
    * Drop exact keys.
    */
  def dropKeys(keys: String*): T = { key =>
    if (keys.contains(key)) None else Some(key)
  }

  /**
    * Simple aliasing after earlier transforms (acts on the current key string).
    */
  def alias(pairs: (String, String)*): T = {
    val m = pairs.toMap
    key => Some(m.getOrElse(key, key))
  }

  /**
    * Strip a prefix like "metadata." if present. Leaves others unchanged.
    */
  def stripPrefix(prefix: String): T = { key =>
    if (key.startsWith(prefix)) Some(key.substring(prefix.length)) else Some(key)
  }

  /**
    * Collision-safe collapse of a top-level prefix (e.g., "metadata"). If collapsing would create duplicates, the
    * conflicting keys keep their original dotted form.
    */
  def collapsePrefixSafe(prefix: String, previewAllKeys: Seq[String]): T = {
    val dot       = prefix + "."
    // compute potential collapsed name for each key
    val collapsed = previewAllKeys.map { k =>
      if (k.startsWith(dot)) k -> k.substring(dot.length) else k -> k
    }
    val counts    = collapsed.groupBy(_._2).mapValues(_.size)
    val collide   = counts.collect { case (name, n) if n > 1 => name }.toSet

    { key =>
      if (key.startsWith(dot)) {
        val name = key.substring(dot.length)
        // If collision on the collapsed name, keep dotted original to stay unique.
        Some(if (collide(name)) key else name)
      } else Some(key)
    }
  }

  /**
    * Compose transforms left-to-right. First one runs first.
    */
  def chain(ts: T*): T = { key =>
    var cur: Option[String] = Some(key)
    var i                   = 0
    while (i < ts.length && cur.isDefined) {
      cur = ts(i)(cur.get)
      i += 1
    }
    cur
  }
}
