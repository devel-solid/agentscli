# AGENTS.md

## Project

This is an independent Git hub for explicitly selected conventions and skills. The manifest records the hub content version; native Git tags use `v<version>`.

## Workflows

- Use agentscli-hub-write-conventions for handwritten internal rules.
- Use agentscli-hub-edit-agents for this file.
- Use agentscli-hub-write-shared-conventions for shared convention templates.
- Use agentscli-hub-write-shared-skills for complete shared skill trees.
- Use agentscli-hub-publish when asked to publish hub changes. It assesses impact, derives the content version, and verifies native Git delivery.

Discover each skill through the available project skills and its activation description. Each has one responsibility and its own deterministic scripts. Run its included validation; do not rely on prose review for mechanically decidable rules.

## Conventions

Read [resource authoring](docs/conventions/resource-authoring.md) when maintaining hub content.

## Ownership

Only this file, `docs/conventions/`, `shared/conventions/`, and `shared/skills/` are authored content. The manifest version and Git policy are preserved state. The five operational skill directories under `.agents/skills/` and README are managed by `agentscli-hub apply`; edits there are disposable. Preserve unrelated content and staging. Do not execute shared skill code during inspection or publish without a publication request.
