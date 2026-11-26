# Mixed decisions: fixture independence and fixed clocks

## Hypothetical context

A fictional parcel service requires fresh mutable fixture state, including nested collections, for every factory call. Separately, elapsed-time tests supply a fixed clock to the unit under test, per test without changing global time. Tests unrelated to time need no clock. No fixture or clock library is selected.

Read the complete [inadequate convention](inadequate/test-fixtures-and-clocks.md), then both complete replacements: [fixture independence](corrected/fixture-independence.md) and [fixed test clocks](corrected/fixed-test-clocks.md).

## Before: a broad topic hides independent decisions

The draft combines object isolation and elapsed-time control under Testing and invents a common reset. A formatting test cannot tell whether it needs a clock. A mutation-leak fix is directed toward resetting time even though a clock cannot make two shared arrays independent.

An intermediate rewrite with separate headings in the same file would still make either task discover and load both agreements. Responsibility is a file/discovery boundary, not just an outline choice.

## After: separate decisions and precise triggers

The fixture convention owns fresh outer and nested objects. Its example mutates one parcel's array and observes an untouched second parcel, exposing why shallow copying fails. The clock convention owns elapsed-time determinism, per-test injection, and the global-time restriction. Its example contrasts an expiry-dependent lease with a time-independent label test.

The unsupported combined-reset instruction is removed because this hypothetical context never required coupling those controls. In a real refactoring proposal, account for every established obligation and surface any policy change before writes.

The index replaces one broad entry with two titles and independent reading conditions. Neither replacement routes the reader through the other.

## When to keep content together

Canonical public option spelling and the temporary alias exception for supported callers govern one decision and should stay together; case 08 illustrates that boundary. File length and heading count do not determine responsibility.
