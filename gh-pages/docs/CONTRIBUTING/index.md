# Contributing to Sbt ScalaMetrics

Thanks for your interest in improving `sbt-scalametrics`! We welcome issues, discussions, and pull requests from
everyone.
By participating, you agree to follow our [Code of Conduct](CODE_OF_CONDUCT.md).

## Guidelines

The goal of this project is to provide a simple, easy-to-use tool to generate source code metrics for Scala projects.
For most, the generated JSON and CSV files are useful, the HTML file is provided as a nice add-on to be able to quickly
view the project metrics in a more user-friendly way. The HTML report is a self-contained file that can be opened
without running a web server. Since the data, javascript, and all styles are baked into the HTML file, the file size
and (browser) memory usage should be kept in mind when adding new features to the report.

- **General guidelines**
	- `sbt-scalametrics` should maintain a zero-dependency footprint (excluding ScalaMetrics and ScalaMeta). Adding
	  dependencies to the library must be avoided. Exceptions to this rule are `sbt` plugins, test dependencies and in
	  very rare cases which are not packaged in the releases.
	- Adhere to basic [Scala Style Guile](https://docs.scala-lang.org/style/) and use `scalaFmt` plugin to enforce a few
	  basic rules.
	- Compiler warnings must be fixed and should not be suppressed. If you are not sure how to fix a warning, please
	  open an issue. Exceptions might be made for rare cases related to issues raised due to cross-compilation of the
	  code.
	- Avoid leaving `TODO` or `FIXME` comments in the code.
- **API design**
	- Avoid breaking changes. If unavoidable, discuss first and mark clearly.
- **Naming & docs**
	- All public **and** private types/methods and any nested types/methods must be documented with examples using
	  Scaladoc comments (purpose, params, complexity.)
- **Testing**
	- Use **ScalaTest** for behavior tests when suitable.
	- Cover success + edge cases + failure modes. Use the `sbt-coverage` plugin to check the test coverage.

## How can I Help?

- **Bug reports:** Use the *Bug report* template. Provide a minimal reproduction (code + versions).
- **Feature requests:** Start a discussion first; include motivation, API sketch, prior art.
- **Documentation:** Typos, examples, and API clarifications are great first PRs.
- **Good first issues:** Look for labels `good first issue`, `help wanted`, and `milestones`.

## Development Environment

- **JDK:** 17
- **Scala:** 2.12.x
- **sbt:** latest stable

### Project Structure

The main plugin entry point is in `src/main/scala/com/bitblends/sbt/scalametrics/ScalaMetricsPlugin.scala`.

- Parses the arguments
- Sets up the configuration
- Detects source directories
- Invokes the `ScalaMetrics` library's `generateProjectStats()` method to perform the analysis and generate the metrics.
- Generates the HTML, JSON, and CSV reports using the `ReportGenerator.generateReport()` method by passing the
  `ProjectStats` case class from the previous step.
- `generateReport()` creates a JSON representation of the `ProjectStats` data, which is written to the output file for
  separate consumption. Additionally, this is converted to a compressed Javascript variable and injects it into the HTML
  report template.

#### HTML Report

To avoid creating and dealing with multiple files and dependencies, the HTML report is generated as a single
self-contained file. This means that all CSS styles, JavaScript code, and **data** are embedded
directly into the generated HTML file.

It is easier to host, relocate, or link to a single HTML file without worrying about having a web-server and dealing
with browser issues.

#### Template

The HTML report generation uses a pre-defined template located in
`src/main/resources/templates/metrics-report-template.html`.

#### JavaScript

All JavaScript code for rendering the charts and tables are located in `src/main/resources/templates/metrics-report.js`.
During the report generation, metrics data is injected into the `src/main/resources/templates/metrics-report.js` at the
`{{METRICS_DATA_JS}}` as a Javascript variable.

`metrics-report.js` will be compressed and injected into the HTML template at `{{METRICS_JS_CONTENT}}` placeholder by
the report generator.

#### CSS

The HTML file uses TailwindCSS for styling. The styles are required to be compiled and injected into the `<style>` tag
in the header of the template. This step is needed for any changes in the `metrics-report-template.html` that defines
new styles (regardless of them being custom or not).

Custom styles are defined in `src/main/resources/templates/tailwind.css`.

To compile the CSS, you need to have `Node.js` and `npm` installed. A convenient script is provided in
`(src/main/resources/build_css.sh)` to quickly build the CSS file and replace the values in `<style>` tag in the HTML
template.

<!-- @formatter:off -->
<!-- format: off -->

> [!IMPORTANT]
> If you make changes to `src/main/resources/templates/metrics-report-template.html` or `src/main/resources/templates/metrics-report.js`, you must compile the CSS (using `build_css.sh`).

<!-- @formatter:on -->
<!-- format: on -->

## Commit & PR process

- **Small PRs** are easier to review.
- **Conventional Commits** style is encouraged, use feature, fix, docs, style, refactor, test, chore, etc. so they get
  picked up by auto labeler in CICD, for example:
	- `feat: added new chart to HTML report`
	- `bugfix: handle empty source files`
	- `doc: clarify usage of cli arguments`
- **Release Versioning:** CI uses automated versioning based on Conventional Commits. Avoid manually updating version
  numbers in `build.sbt` or other files. In a commit message include `#patch`, `#minor`, or `#major` to indicate the
  type of version bump for the next release. Example: `feat: added new chart to HTML report #minor`
- **Branch naming:** use descriptive names like `feature/complexity-metric`, `bugfix/missing-report-section` so it's
  clear what the branch is about and allows CI to label PRs automatically. For a list of recognized labels, see
  `pr-labels.yml` in `.github/workflows/`.
- Keep PRs focused to a single concern
- Update `gh-pages/` when applicable.
- CI will enforce the checklist below but ensure the checklist passes locally before opening a PR.

### PR Checklist

- [x] `sbt scalafmtCheckAll` passes
- [x] `sbt scalafixAll` applied to fix
- [x] `sbt headerCreate` to add missing headers to source files
- [x] `sbt test` green
- [x] Public APIs documented; examples updated if needed
- [x] Commit(s) signed off per DCO (see below)

> CI runs the same checks. If it fails locally, it will fail in CI.

## Legal: License & DCO

- License: MIT (see [LICENSE](LICENSE)).
- Provenance: We use the **Developer Certificate of Origin (DCO)

Sign off each commit with:

```
Signed-off-by: Your Name <you@example.com>
```

You can add the sign-off automatically:

```bash
git commit -s -m "feat: added new chart to HTML report"
```

If you authored code that includes third-party material, ensure its license is compatible with MIT and attribute
accordingly.

## Security

If you believe you’ve found a vulnerability, **DO NOT OPEN A PUBLIC ISSUE**. Please email <b>
scalametrics&commat;bitblends.com</b> for private disclosure.

## Release Process (maintainers)

Releases are performed via tags and `sbt-ci-release`. On `vX.Y.Z` tag:

- CI publishes artifacts to Sonatype.

Community members: if you need a release, please comment on the relevant issue.

## Community & support

- **Bugs/Features/Questions:** GitHub Issues

We appreciate your time and contributions—thank you for helping make **Sbt ScalaMetrics** better!
