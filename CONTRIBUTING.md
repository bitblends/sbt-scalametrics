# Contributing to Sbt ScalaMetrics

Thanks for your interest in improving `sbt-scalametrics`! We welcome issues, discussions, and pull requests from
everyone.
By participating, you agree to follow our [Code of Conduct](CODE_OF_CONDUCT.md).

## Guidelines

The goal of this project is to provide a simple, easy-to-use tool to generate source code metrics for Scala projects.
For most, the generated JSON and CSV files are useful, the HTML file is provided as a nice add-on to be able to quickly
view the project metrics in a more user-friendly way. The HTML report is a self-contained file that can be opened
without running a web server. Since the data, javascript and all styles are baked into the HTML file, the file size
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
	- Avoid leaving TODO or FIXME in the code.
- **API design**
	- Avoid breaking changes. If unavoidable, discuss first and mark clearly.
- **Naming & docs**
	- All public **and** private types/methods and any nested types/methods must be documented with examples using
	  Scaladoc comments (purpose, params, complexity.)
- **Testing**
	- Use **ScalaTest** for behavior tests when suitable.
	- Cover success + edge cases + failure modes. Use the `sbt-coverage` plugin to check the test coverage.

---

## How can I Help?

- **Bug reports:** Use the *Bug report* template. Provide a minimal reproduction (code + versions).
- **Feature requests:** Start a discussion first; include motivation, API sketch, prior art.
- **Documentation:** Typos, examples, and API clarifications are great first PRs.
- **Good first issues:** Look for labels `good first issue`, `help wanted`, and `milestones`.

---

## Development Environment

- **JDK:** 17
- **Scala:** 2.12.x
- **sbt:** latest stable

> CI runs the same checks. If it fails locally, it will fail in CI.

---

## Commit & PR process

- **Small PRs** are easier to review.
- **Conventional Commits** style is encouraged, use feature, fix, docs, style, refactor, test, chore, etc. so they get
  picked up by auto labeler in CICD, for example:
	- `feat: added new chart to HTML report`
	- `bugfix: handle empty source files`
	- `doc: clarify usage of cli arguments`
- Keep PRs focused to a single concern
- Update `gh-pages/` when applicable.
- CI will enforce the checklist below but ensure the checklist passes locally before opening a PR.

---

### PR Checklist

- [ ] `sbt scalafmtCheckAll` passes
- [ ] `sbt scalafixAll` applied to fix
- [ ] `sbt headerCreate` to add missing headers to source files
- [ ] `sbt test` green
- [ ] Public APIs documented; examples updated if needed
- [ ] Commit(s) signed off per DCO (see below)

---

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

---

## Security

If you believe you’ve found a vulnerability, **DO NOT OPEN A PUBLIC ISSUE**. Please email <b>
scalametrics&commat;bitblends.com</b> for private disclosure.

---

## Release Process (maintainers)

Releases are performed via tags and `sbt-ci-release`. On `vX.Y.Z` tag:

- CI publishes artifacts to Sonatype.

Community members: if you need a release, please comment on the relevant issue.

---

## Community & support

- **Bugs/Features/Questions:** GitHub Issues

We appreciate your time and contributions—thank you for helping make **Sbt ScalaMetrics** better!
