# Apple Release Secrets Setup Guide

- Last Updated: 2026-03-07
- Applies To: `.github/workflows/desktop-packaging.yml`
- Scope: macOS signing / notarization secrets for tag-based GitHub Releases

## What This Guide Covers

This guide explains how to prepare the Apple Developer and App Store Connect
materials required by the repository release workflow, and how to store them as
GitHub Actions repository secrets.

The current workflow reads these secrets:

- `APPLE_CERTIFICATE`
- `APPLE_CERTIFICATE_PASSWORD`
- `APPLE_SIGNING_IDENTITY` (optional)
- `APPLE_API_KEY`
- `APPLE_API_ISSUER`
- `APPLE_API_KEY_P8`

Workflow reference: `.github/workflows/desktop-packaging.yml`

## Expected Outcomes

- If no Apple secrets are configured, macOS tag builds stay unsigned.
- If only the certificate secrets are configured, macOS tag builds are signed.
- If the certificate and App Store Connect secrets are all configured, macOS
  tag builds are signed and notarized.

## Prerequisites

- A Mac with `Keychain Access`
- Access to the Apple Developer account used for Klip releases
- Access to App Store Connect for the same team
- Access to configure repository-level GitHub Actions secrets

Reference docs:

- Tauri macOS signing:
  `https://v2.tauri.app/distribute/sign/macos/`
- Apple CSR guide:
  `https://developer.apple.com/help/account/certificates/create-a-certificate-signing-request`
- Apple Developer ID certificates:
  `https://developer.apple.com/help/account/certificates/create-developer-id-certificates/`
- App Store Connect API:
  `https://developer.apple.com/help/app-store-connect/get-started/app-store-connect-api`
- GitHub Actions secrets:
  `https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets`

## Roles and Access

- Apple Developer `Developer ID Application` certificates require the
  `Account Holder` role.
- App Store Connect API access must first be requested by the `Account Holder`.
- Team API keys can be created by the `Account Holder` or an `Admin`.
- GitHub repository secrets require repository write/admin access, depending on
  the repository ownership model.

## Secret Value Map

| Secret | Value Format | Where It Comes From |
| --- | --- | --- |
| `APPLE_CERTIFICATE` | Base64 text | Exported `.p12` code-signing certificate |
| `APPLE_CERTIFICATE_PASSWORD` | Plain text | Password chosen during `.p12` export |
| `APPLE_SIGNING_IDENTITY` | Plain text | Optional signing identity from `security find-identity -v -p codesigning` |
| `APPLE_API_KEY` | Plain text | App Store Connect API Key ID |
| `APPLE_API_ISSUER` | Plain text | App Store Connect Issuer ID |
| `APPLE_API_KEY_P8` | Raw file contents | Contents of `AuthKey_<KEYID>.p8` |

## Step 1: Create a CSR on macOS

1. Open `Keychain Access` from `/Applications/Utilities`.
2. Choose `Keychain Access > Certificate Assistant > Request a Certificate from a Certificate Authority`.
3. Enter the requested email and common name.
4. Save the request to disk as a `.certSigningRequest` file.

Result: you now have the CSR needed to request a Developer ID certificate.

## Step 2: Create a Developer ID Application Certificate

1. Open Apple Developer `Certificates, Identifiers & Profiles`.
2. Go to `Certificates`.
3. Create a new certificate under `Developer ID`.
4. Choose `Developer ID Application`.
5. Upload the `.certSigningRequest` file.
6. Download the generated `.cer` file.
7. Open the downloaded `.cer` file to install it into Keychain.

Result: the certificate appears in `Keychain Access > My Certificates`.

## Step 3: Export the Signing Certificate as `.p12`

1. In `Keychain Access`, open `My Certificates`.
2. Find the installed `Developer ID Application` certificate entry.
3. Expand it and confirm a private key is present.
4. Export the certificate as a `.p12` file.
5. Set and record a password for the export.

Use this exported password as `APPLE_CERTIFICATE_PASSWORD`.

If the private key is missing, the exported certificate will not work for CI
signing.

## Step 4: Convert the `.p12` Certificate to Base64

Run:

```bash
openssl base64 -A -in /path/to/DeveloperID.p12 -out /path/to/DeveloperID.p12.base64
```

Use:

- Contents of `DeveloperID.p12.base64` as `APPLE_CERTIFICATE`
- The export password from Step 3 as `APPLE_CERTIFICATE_PASSWORD`

## Step 5: Capture the Optional Signing Identity

Run on the Mac where the certificate is installed:

```bash
security find-identity -v -p codesigning
```

If you want to pin the exact identity, store the matching identity string as
`APPLE_SIGNING_IDENTITY`. This repository treats it as optional.

## Step 6: Request App Store Connect API Access

1. Open App Store Connect.
2. Go to `Users and Access > Integrations`.
3. Request access to the App Store Connect API if it has not already been
   approved for the team.

This request must be submitted by the `Account Holder`, and Apple notes that it
is reviewed case by case.

## Step 7: Generate a Team API Key

1. In App Store Connect, open `Users and Access > Integrations`.
2. Click `Team Keys`.
3. Click `Generate API Key`.
4. Give the key a descriptive name.
5. Select the access scope/role needed for notarization workflows.
6. Generate the key and download `AuthKey_<KEYID>.p8`.

Capture:

- `Key ID` as `APPLE_API_KEY`
- `Issuer ID` as `APPLE_API_ISSUER`
- Raw contents of `AuthKey_<KEYID>.p8` as `APPLE_API_KEY_P8`

Important:

- The `.p8` file is typically only downloadable once.
- Store the raw file contents in GitHub Secrets; do not base64-encode it for
  this workflow.

## Step 8: Store Secrets in GitHub

### Option A: GitHub Web UI

1. Open the repository on GitHub.
2. Go to `Settings`.
3. Open `Secrets and variables > Actions`.
4. Create repository secrets for each required key.

Required secret names:

- `APPLE_CERTIFICATE`
- `APPLE_CERTIFICATE_PASSWORD`
- `APPLE_API_KEY`
- `APPLE_API_ISSUER`
- `APPLE_API_KEY_P8`

Optional:

- `APPLE_SIGNING_IDENTITY`

### Option B: GitHub CLI

Login first if needed:

```bash
gh auth login
```

Set the secrets:

```bash
gh secret set APPLE_CERTIFICATE < /path/to/DeveloperID.p12.base64
gh secret set APPLE_CERTIFICATE_PASSWORD
gh secret set APPLE_API_KEY
gh secret set APPLE_API_ISSUER
gh secret set APPLE_API_KEY_P8 < /path/to/AuthKey_<KEYID>.p8
```

Optional:

```bash
gh secret set APPLE_SIGNING_IDENTITY
```

List configured secrets:

```bash
gh secret list
```

## Step 9: Verify the Workflow Mode

Use the `Desktop Packaging` workflow with `workflow_dispatch` first.

Expected `macOS bundle mode` values in the job log:

- `unsigned`: no usable Apple secrets were found
- `signed`: certificate secrets are configured
- `signed-and-notarized`: certificate and App Store Connect secrets are all configured

This dry run uploads Actions artifacts but does not publish a GitHub Release.

## Step 10: Run a Tag-Based Release

After the manual packaging dry run succeeds, trigger a tag build:

```bash
git tag v0.1.0-rc.1
git push origin v0.1.0-rc.1
```

Expected outcome:

- macOS `.dmg` and Windows `.exe` assets attach to the matching GitHub Release
- The Release body is rendered from `.github/release-notes-template.md`

## Troubleshooting Notes

- Free Apple Developer accounts cannot notarize applications.
- Missing private key in Keychain means the exported `.p12` will not work.
- If only `APPLE_CERTIFICATE` and `APPLE_CERTIFICATE_PASSWORD` are configured,
  the workflow should sign but not notarize.
- `APPLE_API_KEY_P8` must be stored as raw file contents, not a path.
- `APPLE_SIGNING_IDENTITY` can be omitted unless Tauri fails to infer the
  correct identity automatically.

## Internal Follow-Up Checklist

- Provision repository secrets on GitHub
- Run `workflow_dispatch` for `Desktop Packaging`
- Confirm `macOS bundle mode` in the workflow log
- Push a `v*` tag for an end-to-end release test
- Record the result in `docs/status/packaging-verification-us011.md`
