# Security Policy

## Supported Versions

Use this section to tell people about which versions of your project are currently being supported with security updates.

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |
| < 0.1   | :x:                |

## Reporting a Vulnerability

We take the security of this project seriously. If you discover a security vulnerability, we appreciate your help in disclosing it to us in a responsible manner.

To report a vulnerability, please do **not** create a public issue. Instead, please use one of the following methods:

1. **GitHub Security Advisories**: If enabled for this repository, please use the "Report a vulnerability" button in the "Security" tab.
2. **Email**: If you prefer or if the above is not available, please contact the maintainer via email (see package.json author field or GitHub profile).

We will investigate all legitimate reports and do our best to quickly fix the problem. We ask that you give us a reasonable amount of time to respond before making the vulnerability public.

## Security Considerations

Since this project acts as a proxy for the ThetaData Terminal:

- It is designed for **local use only**.
- It does not implement authentication or encryption by default.
- **Do not expose this service to the public internet** without adding your own security layer (e.g., reverse proxy with auth, VPN).
- Requests submitted to the proxy are forwarded to your local ThetaData Terminal, which may have its own security implications.
