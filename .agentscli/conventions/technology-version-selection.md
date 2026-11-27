---
trigger: Read before adopting or choosing maintenance lines and updates for packages, language runtimes, or other technologies.
reviewedHash: 'fbbaeb7e612232881b39e3dc01bb1b94f959b2600b83c0d7aa2eef6f110ffacc'
reviewPolicyVersion: '1'
---

# Technology version selection

When adopting or updating packages, language runtimes, or other technologies, choose in two stages: first the maintenance line, then the applicable stable version within it. Use the maintainer's published line boundaries; do not assume every major version has a single support cycle. This policy governs adopted technologies, not the CLI's own release numbering.

## Line eligibility

Among lines compatible with the project and still maintained, select the newest that has completed twelve months since its first stable release. Its remaining support must also cover the intended period of use; a line nearing the end of maintenance does not qualify merely because it is old.

If the vendor maintains LTS lines, select among them. For technologies without that classification, use stable lines with the same age, compatibility, and maintenance criteria. Exclude prereleases such as beta, RC, and nightly, and lines whose support has ended.

Count the twelve months from the line's first stable release. Entering LTS or receiving a fix does not restart that clock. There is no requirement to step back another line beyond the newest LTS line that already qualifies.

Consider this fictional evaluation on **August 15, 2030**. All lines below are already LTS, work with the project, and have sufficient maintenance and remaining support:

| Candidate line | First stable release | Status on the evaluation date                                              |
| -------------- | -------------------- | -------------------------------------------------------------------------- |
| A              | April 1, 2028        | Qualifies, but a newer option also meets the criteria.                     |
| B              | August 15, 2029      | Has just completed twelve months: choose this line among these candidates. |
| C              | August 16, 2029      | Is still one day short: being newer does not make it eligible today.       |

Even if B entered LTS only in April 2030, choose B. Waiting until April 2031 would count from the wrong event. These dates and lines illustrate the decision; they are not recommendations for real products.

## Updates within the line

Within the selected line, apply the latest compatible and relevant stable fixes after reading their release notes. Do not apply the line's twelve-month waiting period to each fix.

In the example, a fix for B released yesterday can be adopted today; it does not make the line new again. Do not delay a security fix because of that waiting period. Check how the maintainer distributes fixes: a fix is not necessarily identified only by the last number in a version.

## Evidence and unavailable candidates

Base the decision on official publications about releases, LTS classification, maintenance, end of support, and compatibility requirements. If any of that information cannot be verified, state the gap rather than treating an estimated date as a satisfied criterion.

If no line meets the criteria, identify the impediment. Any exception to the stability period must be explained and grounded in those sources; it does not waive specific requirements such as LTS for Node.js. Without a viable alternative, report the blocker rather than silently selecting an incompatible or abandoned line.

Reevaluate the selection during authorized updates when support, security, or dependency requirements change. Before migrating, check compatibility with consumers. Record the versions actually selected in the responsible manifests and configuration files; instructions must not maintain another inventory of those versions in tables, lists, or prose.
