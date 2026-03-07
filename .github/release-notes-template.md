# Klip {{TAG_NAME}}

## Included Assets

- macOS `.dmg` desktop bundle
- Windows NSIS `.exe` installer

## Packaging Notes

- Pushing a `v*` tag uploads desktop artifacts to the matching GitHub Release.
- `workflow_dispatch` remains an artifact-only dry run and does not create a
  GitHub Release.
- If Apple signing secrets are configured, the macOS bundle is code signed.
- If both the Apple signing and notarization secrets are configured, the macOS
  `.dmg` is notarized during the release build.
- If Apple release secrets are absent, the macOS artifacts remain unsigned and
  may trigger Gatekeeper warnings on first launch.

## Runtime Notes

- macOS may require Accessibility and/or Input Monitoring permissions for
  reliable global hotkey and direct-paste behavior.
- Windows direct paste depends on the foreground app accepting simulated input.
- Clipboard capture in this phase is text-only; image, file, and rich-text
  payloads are intentionally ignored.
- `Launch at login` depends on OS policy and may be blocked by managed-device
  restrictions.
