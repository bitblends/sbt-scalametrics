/*
 * SPDX-FileCopyrightText: 2025 Benjamin Saff and contributors
 * SPDX-License-Identifier: MIT
 */

package com.bitblends.sbtmetrics.csv

import org.scalatest.flatspec.AnyFlatSpec
import org.scalatest.matchers.should.Matchers

class HeaderTSpec extends AnyFlatSpec with Matchers {

  "HeaderT.identity" should "preserve all keys unchanged" in {
    val keys = Seq("key1", "key2", "nested.key3")
    keys.foreach { key =>
      HeaderT.identity(key) shouldBe Some(key)
    }
  }

  "HeaderT.dropPrefixes" should "drop keys with specified prefixes" in {
    val transform = HeaderT.dropPrefixes("metadata", "internal")

    transform("metadata.name") shouldBe None
    transform("metadata") shouldBe None
    transform("internal.id") shouldBe None
    transform("public.data") shouldBe Some("public.data")
    transform("name") shouldBe Some("name")
  }

  it should "handle multiple prefixes correctly" in {
    val transform = HeaderT.dropPrefixes("a", "b", "c")

    transform("a.field") shouldBe None
    transform("b.field") shouldBe None
    transform("c.field") shouldBe None
    transform("d.field") shouldBe Some("d.field")
  }

  it should "not drop partial prefix matches" in {
    val transform = HeaderT.dropPrefixes("meta")

    transform("metadata.name") shouldBe Some("metadata.name")
    transform("meta.name") shouldBe None
    transform("meta") shouldBe None
  }

  "HeaderT.dropKeys" should "drop exact matching keys" in {
    val transform = HeaderT.dropKeys("id", "timestamp", "internal")

    transform("id") shouldBe None
    transform("timestamp") shouldBe None
    transform("internal") shouldBe None
    transform("name") shouldBe Some("name")
    transform("id.nested") shouldBe Some("id.nested")
  }

  "HeaderT.alias" should "rename specified keys" in {
    val transform = HeaderT.alias(
      "oldName" -> "newName",
      "a.b.c"   -> "simplified"
    )

    transform("oldName") shouldBe Some("newName")
    transform("a.b.c") shouldBe Some("simplified")
    transform("unchanged") shouldBe Some("unchanged")
  }

  it should "handle empty alias map" in {
    val transform = HeaderT.alias()
    transform("anyKey") shouldBe Some("anyKey")
  }

  "HeaderT.stripPrefix" should "remove prefix from keys that have it" in {
    val transform = HeaderT.stripPrefix("metadata.")

    transform("metadata.name") shouldBe Some("name")
    transform("metadata.version") shouldBe Some("version")
    transform("name") shouldBe Some("name")
    transform("other.field") shouldBe Some("other.field")
  }

  it should "handle empty prefix" in {
    val transform = HeaderT.stripPrefix("")
    transform("key") shouldBe Some("key")
  }

  "HeaderT.collapsePrefixSafe" should "collapse prefix without collisions" in {
    val allKeys   = Seq("metadata.name", "metadata.version", "id")
    val transform = HeaderT.collapsePrefixSafe("metadata", allKeys)

    transform("metadata.name") shouldBe Some("name")
    transform("metadata.version") shouldBe Some("version")
    transform("id") shouldBe Some("id")
  }

  it should "preserve dotted keys on collision" in {
    val allKeys   = Seq("metadata.name", "name", "metadata.id", "id")
    val transform = HeaderT.collapsePrefixSafe("metadata", allKeys)

    // These would collide, so keep original
    transform("metadata.name") shouldBe Some("metadata.name")
    transform("metadata.id") shouldBe Some("metadata.id")

    // Non-prefixed keys remain unchanged
    transform("name") shouldBe Some("name")
    transform("id") shouldBe Some("id")
  }

  it should "handle no collisions when prefix not present" in {
    val allKeys   = Seq("name", "version", "id")
    val transform = HeaderT.collapsePrefixSafe("metadata", allKeys)

    allKeys.foreach { key =>
      transform(key) shouldBe Some(key)
    }
  }

  "HeaderT.chain" should "apply transforms in sequence" in {
    val transform = HeaderT.chain(
      HeaderT.stripPrefix("metadata."),
      HeaderT.alias("name" -> "title")
    )

    transform("metadata.name") shouldBe Some("title")
    transform("metadata.version") shouldBe Some("version")
  }

  it should "handle None results in the chain" in {
    val transform = HeaderT.chain(
      HeaderT.dropKeys("skip"),
      HeaderT.alias("skip" -> "aliased")
    )

    // First transform returns None, so chain stops
    transform("skip") shouldBe None
    transform("keep") shouldBe Some("keep")
  }

  it should "handle empty chain" in {
    val transform = HeaderT.chain()
    transform("key") shouldBe Some("key")
  }

  it should "handle single transform" in {
    val transform = HeaderT.chain(HeaderT.stripPrefix("prefix."))
    transform("prefix.name") shouldBe Some("name")
  }

  it should "apply complex multi-step transformations" in {
    val transform = HeaderT.chain(
      HeaderT.dropPrefixes("internal"),
      HeaderT.stripPrefix("metadata."),
      HeaderT.alias("name" -> "displayName", "id" -> "identifier")
    )

    transform("internal.data") shouldBe None
    transform("metadata.name") shouldBe Some("displayName")
    transform("metadata.id") shouldBe Some("identifier")
    transform("metadata.version") shouldBe Some("version")
    transform("public") shouldBe Some("public")
  }
}
