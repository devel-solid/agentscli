---
trigger: Read when teaching a convention decision or reviewing whether its examples are sufficient.
reviewedHash: 'de5161ef20cf66031eec6d3ae36f92bcf6804d15112594c512fde1507fe9bcb7'
reviewPolicyVersion: '1'
---

# Convention examples

Use concrete examples to teach choices a reader could plausibly get wrong, especially responsibility boundaries, exceptions, precedence, transformations, and non-obvious technical rules. Show the situation or input, the compliant outcome, a plausible inadequate alternative, and why the difference matters. Complete before/after files are appropriate when the change is structural. Use established project facts; hypothetical teaching cases must explicitly establish their own agreements.

Before: "Use independent fixtures. For example, keep fixtures independent." The example repeats the aspiration and leaves shallow copies ambiguous. After: create two parcels with empty nested checkpoint arrays, append a checkpoint to the first, and observe that the second remains empty. Explain that copying only the outer object leaves the array shared, and cleanup after the test cannot make the factory results independent.

Before: "Use safe archive paths." After: with `/bundle` as the root, `images/../index.txt` resolves inside it, while `../bundle-old/index.txt` escapes despite a shared textual prefix. The examples expose the containment decision.

A simple literal choice such as lowercase `.snap` can remain short when no ambiguity remains. Concision must not excuse omitting evidence that teaches a real distinction. Choose the useful form without quotas, forced variety, mandatory sections, or a minimum length; several before/after examples are justified when they teach different decisions.
