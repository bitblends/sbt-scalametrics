---
title: JSON Schema Definition
description: JSON Schema definitions for ScalaMetrics code metrics data structures.
keywords: [ ScalaMetrics, JSON Schema, code metrics, data structures, schema definition ]
layout: doc
hide: [ title ]
---

# JSON Schema Definition

Below is the JSON schema definition for the ScalaMetrics code metrics data structures:

``` json title="metrics-report.schema.json"
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://github.com/bitblends/sbt-scalametrics/src/main/resources/metrics-report.schema.json",
  "title": "Sbt ScalaMetrics metrics-report",
  "type": "object",
  "additionalProperties": false,
  "required": ["metadata", "rollup", "packageStats"],
  "properties": {
    "metadata": {
      "type": "object",
      "additionalProperties": false,
      "required": ["organization", "name", "description", "version", "scalaVersion"],
      "properties": {
        "licenses": { "type": "string" },
        "organization": { "type": "string" },
        "name": { "type": "string" },
        "description": { "type": "string" },
        "apiURL": { "type": "string", "format": "uri" },
        "organizationHomepage": { "type": "string", "format": "uri" },
        "organizationName": { "type": "string" },
        "scalaVersion": { "type": "string" },
        "startYear": { "type": "string" },
        "version": { "type": "string" },
        "homepage": { "type": "string", "format": "uri" },
        "developers": { "type": "string" },
        "isSnapshot": { "type": "string" },
        "crossScalaVersions": {
          "type": "array",
          "items": { "type": "string" }
        },
        "scmInfo": { "type": "string" },
        "projectInfoNameFormal": { "type": "string" },
        "versionScheme": { "type": "string" }
      }
    },
    "rollup": { "$ref": "#/$defs/Rollup" },
    "packageStats": {
      "type": "array",
      "items": { "$ref": "#/$defs/PackageStats" }
    }
  },
  "$defs": {
    "PatternMatchingStats": {
      "type": "object",
      "additionalProperties": false,
      "required": ["avgCasesPerMatch", "nestedMatches", "guards", "wildcards", "matches", "maxNesting", "cases"],
      "properties": {
        "avgCasesPerMatch": { "type": "number" },
        "nestedMatches": { "type": "integer", "minimum": 0 },
        "guards": { "type": "integer", "minimum": 0 },
        "wildcards": { "type": "integer", "minimum": 0 },
        "matches": { "type": "integer", "minimum": 0 },
        "maxNesting": { "type": "integer", "minimum": 0 },
        "cases": { "type": "integer", "minimum": 0 }
      }
    },
    "ParameterStats": {
      "type": "object",
      "additionalProperties": false,
      "required": ["implicitParams", "totalParams", "usingParamLists", "usingParams", "defaultedParams", "implicitParamLists", "byNameParams", "varargParams", "paramLists"],
      "properties": {
        "implicitParams": { "type": "integer", "minimum": 0 },
        "totalParams": { "type": "integer", "minimum": 0 },
        "usingParamLists": { "type": "integer", "minimum": 0 },
        "usingParams": { "type": "integer", "minimum": 0 },
        "defaultedParams": { "type": "integer", "minimum": 0 },
        "implicitParamLists": { "type": "integer", "minimum": 0 },
        "byNameParams": { "type": "integer", "minimum": 0 },
        "varargParams": { "type": "integer", "minimum": 0 },
        "paramLists": { "type": "integer", "minimum": 0 }
      }
    },
    "BranchDensityStats": {
      "type": "object",
      "additionalProperties": false,
      "required": ["boolOpsCount", "catchCaseCount", "ifCount", "caseCount", "loopCount", "branches", "densityPer100", "boolOpsPer100"],
      "properties": {
        "boolOpsCount": { "type": "integer", "minimum": 0 },
        "catchCaseCount": { "type": "integer", "minimum": 0 },
        "ifCount": { "type": "integer", "minimum": 0 },
        "caseCount": { "type": "integer", "minimum": 0 },
        "loopCount": { "type": "integer", "minimum": 0 },
        "branches": { "type": "integer", "minimum": 0 },
        "densityPer100": { "type": "number", "minimum": 0 },
        "boolOpsPer100": { "type": "number", "minimum": 0 }
      }
    },
    "InlineAndImplicitStats": {
      "type": "object",
      "additionalProperties": false,
      "required": ["explicitPublicDefsValsVars", "inlineParams", "inlineVars", "implicitVals", "givenConversions", "explicitDefsValsVars", "inlineVals", "inlineMethods", "implicitVars", "givenInstances", "implicitConversions"],
      "properties": {
        "explicitPublicDefsValsVars": { "type": "integer", "minimum": 0 },
        "inlineParams": { "type": "integer", "minimum": 0 },
        "inlineVars": { "type": "integer", "minimum": 0 },
        "implicitVals": { "type": "integer", "minimum": 0 },
        "givenConversions": { "type": "integer", "minimum": 0 },
        "explicitDefsValsVars": { "type": "integer", "minimum": 0 },
        "inlineVals": { "type": "integer", "minimum": 0 },
        "inlineMethods": { "type": "integer", "minimum": 0 },
        "implicitVars": { "type": "integer", "minimum": 0 },
        "givenInstances": { "type": "integer", "minimum": 0 },
        "implicitConversions": { "type": "integer", "minimum": 0 }
      }
    },
    "CoreStats": {
      "type": "object",
      "additionalProperties": false,
      "required": ["totalPublicSymbols", "totalDocumentedPublicSymbols", "totalNestedSymbols", "totalDefsValsVars", "totalPublicDefsValsVars", "totalSymbols", "totalFunctions", "totalPublicFunctions", "totalFileSizeBytes", "totalPrivateSymbols", "totalDeprecatedSymbols", "totalPrivateFunctions", "totalLoc"],
      "properties": {
        "totalPublicSymbols": { "type": "integer", "minimum": 0 },
        "totalDocumentedPublicSymbols": { "type": "integer", "minimum": 0 },
        "totalNestedSymbols": { "type": "integer", "minimum": 0 },
        "totalDefsValsVars": { "type": "integer", "minimum": 0 },
        "totalPublicDefsValsVars": { "type": "integer", "minimum": 0 },
        "totalSymbols": { "type": "integer", "minimum": 0 },
        "totalFunctions": { "type": "integer", "minimum": 0 },
        "totalPublicFunctions": { "type": "integer", "minimum": 0 },
        "totalFileSizeBytes": { "type": "integer", "minimum": 0 },
        "totalPrivateSymbols": { "type": "integer", "minimum": 0 },
        "totalDeprecatedSymbols": { "type": "integer", "minimum": 0 },
        "totalPrivateFunctions": { "type": "integer", "minimum": 0 },
        "totalLoc": { "type": "integer", "minimum": 0 }
      }
    },
    "Rollup": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "itemsWithHighParameterCount",
        "itemsWithHighComplexity",
        "itemsWithHighNesting",
        "itemsWithHighPatternMatching",
        "avgCyclomaticComplexity",
        "maxNestingDepth",
        "deprecatedSymbolsDensityPercentage",
        "avgNestingDepth",
        "averageFileSizeBytes",
        "itemsWithLowDocumentation",
        "itemsWithHighBranchDensity",
        "scalaDocCoveragePercentage",
        "returnTypeExplicitness",
        "maxCyclomaticComplexity",
        "publicReturnTypeExplicitness",
        "totalCount",
        "coreStats",
        "patternMatchingStats",
        "parameterStats",
        "branchDensityStats",
        "inlineAndImplicitStats"
      ],
      "properties": {
        "itemsWithHighParameterCount": { "type": "integer", "minimum": 0 },
        "itemsWithHighComplexity": { "type": "integer", "minimum": 0 },
        "itemsWithHighNesting": { "type": "integer", "minimum": 0 },
        "itemsWithHighPatternMatching": { "type": "integer", "minimum": 0 },
        "avgCyclomaticComplexity": { "type": "number", "minimum": 0 },
        "maxNestingDepth": { "type": "integer", "minimum": 0 },
        "deprecatedSymbolsDensityPercentage": { "type": "number", "minimum": 0, "maximum": 100 },
        "avgNestingDepth": { "type": "number", "minimum": 0 },
        "averageFileSizeBytes": { "type": "integer", "minimum": 0 },
        "itemsWithLowDocumentation": { "type": "integer", "minimum": 0 },
        "itemsWithHighBranchDensity": { "type": "integer", "minimum": 0 },
        "scalaDocCoveragePercentage": { "type": "number", "minimum": 0, "maximum": 100 },
        "returnTypeExplicitness": { "type": "number", "minimum": 0, "maximum": 100 },
        "maxCyclomaticComplexity": { "type": "integer", "minimum": 0 },
        "publicReturnTypeExplicitness": { "type": "number", "minimum": 0, "maximum": 100 },
        "totalCount": { "type": "integer", "minimum": 0 },
        "coreStats": { "$ref": "#/$defs/CoreStats" },
        "patternMatchingStats": { "$ref": "#/$defs/PatternMatchingStats" },
        "parameterStats": { "$ref": "#/$defs/ParameterStats" },
        "branchDensityStats": { "$ref": "#/$defs/BranchDensityStats" },
        "inlineAndImplicitStats": { "$ref": "#/$defs/InlineAndImplicitStats" }
      }
    },
    "MemberMetadata": {
      "type": "object",
      "additionalProperties": false,
      "required": ["fileId", "linesOfCode", "name", "declarationType", "isDeprecated", "signature", "isNested", "accessModifier"],
      "properties": {
        "fileId": { "type": "string" },
        "linesOfCode": { "type": "integer", "minimum": 0 },
        "name": { "type": "string" },
        "declarationType": { "type": "string" },
        "isDeprecated": { "type": "boolean" },
        "signature": { "type": "string" },
        "isNested": { "type": "boolean" },
        "accessModifier": { "type": "string" },
        "parentMember": { "type": ["string", "null"] }
      }
    },
    "MemberStats": {
      "type": "object",
      "additionalProperties": false,
      "required": ["hasScaladoc", "complexity", "nestingDepth", "metadata", "patternMatchingStats", "branchDensityStats", "inlineAndImplicitStats"],
      "properties": {
        "hasScaladoc": { "type": "boolean" },
        "complexity": { "type": "integer", "minimum": 0 },
        "nestingDepth": { "type": "integer", "minimum": 0 },
        "metadata": { "$ref": "#/$defs/MemberMetadata" },
        "patternMatchingStats": { "$ref": "#/$defs/PatternMatchingStats" },
        "branchDensityStats": { "$ref": "#/$defs/BranchDensityStats" },
        "inlineAndImplicitStats": { "$ref": "#/$defs/InlineAndImplicitStats" }
      }
    },
    "MethodStats": {
      "type": "object",
      "additionalProperties": false,
      "required": ["hasScaladoc", "complexity", "nestingDepth", "metadata", "patternMatchingStats", "parameterStats", "branchDensityStats", "inlineAndImplicitStats"],
      "properties": {
        "hasScaladoc": { "type": "boolean" },
        "complexity": { "type": "integer", "minimum": 0 },
        "nestingDepth": { "type": "integer", "minimum": 0 },
        "metadata": {
          "type": "object",
          "allOf": [{ "$ref": "#/$defs/MemberMetadata" }],
          "properties": {
            "declarationType": { "type": "string" }
          }
        },
        "patternMatchingStats": { "$ref": "#/$defs/PatternMatchingStats" },
        "parameterStats": { "$ref": "#/$defs/ParameterStats" },
        "branchDensityStats": { "$ref": "#/$defs/BranchDensityStats" },
        "inlineAndImplicitStats": { "$ref": "#/$defs/InlineAndImplicitStats" }
      }
    },
    "FileMetadata": {
      "type": "object",
      "additionalProperties": false,
      "required": ["fileId", "linesOfCode", "packageName", "projectId", "fileName", "filePath", "fileSizeBytes"],
      "properties": {
        "fileId": { "type": "string" },
        "linesOfCode": { "type": "integer", "minimum": 0 },
        "packageName": { "type": "string" },
        "projectId": { "type": "string" },
        "fileName": { "type": "string" },
        "filePath": { "type": "string" },
        "fileSizeBytes": { "type": "integer", "minimum": 0 }
      }
    },
    "FileStats": {
      "type": "object",
      "additionalProperties": false,
      "required": ["metadata", "rollup", "memberStats", "methodStats"],
      "properties": {
        "metadata": { "$ref": "#/$defs/FileMetadata" },
        "rollup": { "$ref": "#/$defs/Rollup" },
        "memberStats": {
          "type": "array",
          "items": { "$ref": "#/$defs/MemberStats" }
        },
        "methodStats": {
          "type": "array",
          "items": { "$ref": "#/$defs/MethodStats" }
        }
      }
    },
    "PackageMetadata": {
      "type": "object",
      "additionalProperties": false,
      "required": ["projectId", "name"],
      "properties": {
        "projectId": { "type": "string" },
        "name": { "type": "string" }
      }
    },
    "PackageStats": {
      "type": "object",
      "additionalProperties": false,
      "required": ["metadata", "rollup", "fileStats"],
      "properties": {
        "metadata": { "$ref": "#/$defs/PackageMetadata" },
        "rollup": { "$ref": "#/$defs/Rollup" },
        "fileStats": {
          "type": "array",
          "items": { "$ref": "#/$defs/FileStats" }
        }
      }
    }
  }
}

```