import LicenseHeader.header
lazy val sbtScalaMetrics = (project in file("."))
  .enablePlugins(SbtPlugin, ScriptedPlugin, HeaderPlugin)
  .settings(
    scalaVersion                           := "2.12.20",
    name                                   := "sbt-scalametrics",
    description                            := "ScalaMetrics Sbt plugin: comprehensive code metrics and code analysis library for Scala projects",
    organization                           := "com.bitblends",
    organizationName                       := "BitBlends",
    licenses += ("MIT", url("https://opensource.org/licenses/MIT")),
    organizationHomepage                   := Some(url("https://bitblends.com")),
    startYear                              := Some(2025),
    homepage                               := Some(url("https://github.com/bitblends/sbt-scalametrics")),
    developers                             := Authors.authors,
    headerLicense                          := header(startYear.value),
    Compile / packageDoc / publishArtifact := true,
    Compile / packageSrc / publishArtifact := true,
    Compile / publishArtifact              := true,
    Test / parallelExecution               := false,
    Test / fork                            := true,
    Test / packageBin / publishArtifact    := false,
    Test / packageDoc / publishArtifact    := false,
    Test / packageSrc / publishArtifact    := false,
    versionScheme                          := Some("early-semver"),
    pomIncludeRepository                   := { _ => false },
    javacOptions ++= Seq("--release", "17"),
    scalacOptions ++= Seq(
      "-deprecation",
      "-encoding",
      "UTF-8",
      "-feature",
      "-unchecked"
    ),
    // Ensure Scalameta is available at runtime by not marking it as "provided"
    // SBT plugins use Scala 2.12, so scalameta_2.12 will be used regardless of target project's Scala version
    libraryDependencies ++= Seq(
      "com.bitblends"        %% "scalametrics"     % "1.1.0",
      "org.scala-lang"        % "scala-compiler"   % scalaVersion.value,
      "org.scalameta"        %% "scalameta"        % "4.14.1",
      "com.google.javascript" % "closure-compiler" % "v20250820",
      "org.scalatest"        %% "scalatest"        % "3.2.17" % Test
    ),
    scriptedLaunchOpts                     := {
      scriptedLaunchOpts.value ++
        Seq("-Xmx1024M", "-Dplugin.version=" + version.value)
    }
  )
