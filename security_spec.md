# Security Specification - Bar Par Stock Pro

## Data Invariants
1. **Authenticated Access**: No data can be read or written without a valid Firebase Auth session.
2. **Strict Schema**: All documents must strictly adhere to the types and keys defined in the blueprint.
3. **Identity Integrity**: `createdBy` fields must match the `request.auth.uid`.
4. **ID Hardening**: Document IDs must be alphanumeric and of reasonable length.

## The "Dirty Dozen" Payloads (Deny List)

1. **Anonymous Read**: Attempt to fetch `/items/item1` without login.
2. **Identity Spoofing**: Create an item with `createdBy: "someone_else_uid"`.
3. **Shadow Field**: Create an item with an extra `isAdmin: true` field.
4. **Invalid Category**: Create an item with `categoryId: "nuclear_waste"`.
5. **Negative Par**: Set `parLevel: -10`.
6. **Huge ID**: Create an item with a 2MB string as ID.
7. **Malformed Date**: Log with `date: "yesterday"`.
8. **PII Injection**: Inject email into item name.
9. **Recipe Overflow**: Create recipe with 10,000 ingredients.
10. **Type Poisoning**: Set `parLevel: "five"`.
11. **Unauthorized Update**: Update an item created by another user (if restricted) or change immutable fields.
12. **Future Log**: Log with `createdAt` set to a future client time.

## Evaluation
All payloads above MUST return `PERMISSION_DENIED`.
