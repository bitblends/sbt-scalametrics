/*
 * SPDX-FileCopyrightText: 2025 Benjamin Saff and contributors
 * SPDX-License-Identifier: MIT
 */

package com.bitblends.sbtmetrics.utils

import com.google.javascript.jscomp.*

import java.util
import scala.collection.JavaConverters.*

object JsMinifier {

  /**
    * Minify a JS string using Google Closure Compiler.
    *
    * @param javascriptSource
    *   JavaScript source
    * @return
    *   (minifiedJs, optionalSourceMapJson)
    */
  def minifyJsString(javascriptSource: String): String = {

    val compiler = new Compiler()
    val options  = new CompilerOptions()
    options.setLanguageIn(CompilerOptions.LanguageMode.ECMASCRIPT_2020)
    options.setLanguageOut(CompilerOptions.LanguageMode.ECMASCRIPT_2020)

    // Apply the chosen optimization level
    CompilationLevel.WHITESPACE_ONLY.setOptionsForCompilationLevel(options)

    // Input JS
    val inputs                         = util.Arrays.asList(SourceFile.fromCode("input.js", javascriptSource))
    val externs: util.List[SourceFile] = util.Collections.emptyList()

    val result = compiler.compile(externs, inputs, options)
    if (!result.success) {
      val errs = result.errors.asScala.map(_.toString).mkString("\n") +
        (if (!result.warnings.isEmpty)
           "\nWarnings:\n" + result.warnings.asScala.map(_.toString).mkString("\n")
         else
           "")
      throw new RuntimeException("Closure compile failed:\n" + errs)
    }

    compiler.toSource

  }

}
