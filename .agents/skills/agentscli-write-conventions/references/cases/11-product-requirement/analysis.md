# Product behavior inside a convention

## Hypothetical context

A fictional booking application has two separate, already approved inputs. Its product specification allows customers to cancel a booking until 24 hours before its start and requires a confirmation screen. Its recurring writing agreement says that buttons committing an action name the immediate action with a verb and object; a confirmation button names the same action and object. A generic navigation label is not an action label. This agreement applies across features and does not decide which features need confirmation.

These are teaching assumptions, not product requirements or writing policies for another project.

Compare the complete [inadequate convention](inadequate/action-labels.md) and [corrected convention](corrected/action-labels.md).

## What remained wrong

The inadequate file looks useful because it contains concrete screen behavior and a writing rule. However, the cancellation deadline and required screen belong to a single feature's specification. Keeping them here creates a second authority for that feature. Its suggested `Continue` label also fails to express the immediate action established by the writing agreement.

The reader cannot tell which statements govern the next action button and which apply only to booking cancellation. A future author could copy the deadline or confirmation requirement into an unrelated action.

## What changed and why

The corrected convention retains the existing cross-feature agreement and removes the feature's deadline and required flow. It does not replace them with a newly invented universal confirmation policy. The contrast between `Continue` and `Cancel booking` demonstrates the label decision using the existing feature, while explicitly leaving the presence of confirmation to its specification. No specification is moved or edited in this exercise.

Two short examples distinguish submitting a new booking from confirming a cancellation. They make the verb depend on the action happening now, rather than on the feature's general subject. A feature matrix or a full screen walkthrough would reintroduce the misplaced specification.

**Transferable concept:** Separate a recurring authoring agreement from the behavior of one feature. Preserve an established agreement when removing misplaced requirements; do not manufacture a replacement policy merely to keep a convention substantial.
