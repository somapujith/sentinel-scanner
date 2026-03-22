from __future__ import annotations

from typing import Any

def _safe_float(x: Any, default: float = 0.0) -> float:
    if x is None or x == "":
        return default
    try:
        v = float(x)
        if v != v:
            return default
        return v
    except (TypeError, ValueError, OverflowError):
        return default


# CVSS-inspired base scores per finding type (simplified model).
WEIGHTS: dict[str, float] = {
    # Injection / auth
    "sql_injection": 9.8,
    "xss_reflected": 7.2,
    # TLS
    "ssl_expired": 9.1,
    "ssl_expiring_soon": 5.5,
    "ssl_weak_protocol": 6.8,
    "ssl_weak_cipher": 6.2,
    "ssl_no_certificate": 8.0,
    "ssl_connection_failed": 3.5,
    "ssl_ok": 1.0,
    # Ports — sensitive services
    "port_telnet_open": 8.4,
    "port_smb_exposed": 8.0,
    "port_redis_exposed": 7.8,
    "port_db_exposed": 7.5,
    "port_postgres_exposed": 7.5,
    "port_mongo_exposed": 7.5,
    "port_mssql_exposed": 7.5,
    "port_elasticsearch_open": 6.8,
    "port_rdp_exposed": 6.5,
    "port_vnc_open": 6.5,
    "port_ssh_open": 5.5,
    "port_ftp_open": 5.5,
    "port_smtp_open": 4.5,
    "port_imap_open": 4.5,
    "port_pop3_open": 4.5,
    "port_msrpc_open": 6.0,
    "port_netbios_open": 5.8,
    "port_dns_open": 2.5,
    "port_http_service": 2.0,
    "port_https_service": 2.0,
    "port_http_alt": 2.5,
    "port_https_alt": 2.5,
    "port_scan_error": 3.0,
    # Headers (existing)
    "missing_csp": 5.3,
    "missing_hsts": 6.1,
    "missing_xframe": 4.5,
    "missing_xcontent_type": 4.2,
    "served_over_http": 5.5,
    "http_fetch_failed": 3.0,
    "robots_disallow": 2.0,
    # Injection probe meta
    "injection_probe_unreachable": 2.5,
    "injection_probe_error": 3.0,
}


def score_findings(findings: list[dict[str, Any]]) -> list[dict[str, Any]]:
    for f in findings:
        vtype = f.get("type", "unknown")
        cvss = _safe_float(WEIGHTS.get(vtype, 3.0), 3.0)
        f["cvss"] = cvss
        f["risk"] = (
            "critical"
            if cvss >= 9.0
            else "high"
            if cvss >= 7.0
            else "medium"
            if cvss >= 4.0
            else "low"
        )
        f["mitigation"] = get_mitigation(vtype)
    return sorted(findings, key=lambda x: x["cvss"], reverse=True)


def aggregate_score(findings: list[dict[str, Any]]) -> float:
    if not findings:
        return 0.0
    return min(
        10.0,
        sum(_safe_float(f.get("cvss"), 0.0) for f in findings) / max(len(findings), 1),
    )


def get_mitigation(vuln_type: str) -> str:
    tips = {
        "sql_injection": "Use parameterised queries and ORM layers; never concatenate user input into SQL. Validate and encode all output.",
        "xss_reflected": "Encode output in the correct context (HTML/JS/URL); use CSP and strict input validation.",
        "ssl_expired": "Renew the TLS certificate immediately; automate renewal (e.g. ACME/Let's Encrypt).",
        "ssl_expiring_soon": "Renew certificates before expiry; monitor with alerting.",
        "ssl_weak_protocol": "Disable TLS 1.0/1.1 and SSL; require TLS 1.2+ on servers and load balancers.",
        "ssl_weak_cipher": "Disable NULL/EXPORT/RC4/3DES; prefer AEAD suites (AES-GCM, ChaCha20-Poly1305).",
        "ssl_no_certificate": "Configure a valid public or private PKI certificate for the service.",
        "ssl_connection_failed": "Ensure port 443 is reachable, certificate chain is valid, and SNI matches the hostname.",
        "ssl_ok": "Maintain monitoring; rotate certificates and review cipher suites periodically.",
        "port_telnet_open": "Disable Telnet; use SSH. Block port 23 at the perimeter firewall.",
        "port_smb_exposed": "Do not expose SMB to the internet; use VPN or Zero Trust access.",
        "port_redis_exposed": "Bind Redis to 127.0.0.1, require AUTH, and firewall port 6379.",
        "port_db_exposed": "Bind MySQL to loopback or private network; require TLS and strong auth for remote access.",
        "port_postgres_exposed": "Use pg_hba.conf restrictions, firewall, and TLS for remote connections.",
        "port_mongo_exposed": "Enable authentication, bind to private IP, and use network segmentation.",
        "port_mssql_exposed": "Restrict with firewall; use Windows auth / strong passwords and TLS.",
        "port_elasticsearch_open": "Enable X-Pack security, bind to private network, never expose 9200 publicly.",
        "port_rdp_exposed": "Use VPN or Bastion; enable NLA; restrict by IP; apply latest patches.",
        "port_vnc_open": "Tunnel over SSH or VPN; use strong passwords and modern VNC with encryption.",
        "port_ssh_open": "If exposed, enforce key-based auth, disable root login, and rate-limit brute force.",
        "port_ftp_open": "Prefer SFTP/FTPS; never use anonymous FTP on public networks.",
        "port_smtp_open": "Harden relay; use authentication; monitor for abuse.",
        "port_imap_open": "Require TLS (IMAPS) and strong authentication; restrict exposure.",
        "port_pop3_open": "Prefer POP3S; restrict to trusted networks.",
        "port_msrpc_open": "Block MSRPC at perimeter; use host firewalls and minimal exposure.",
        "port_netbios_open": "Disable NetBIOS on internet-facing interfaces; use SMB signing.",
        "port_dns_open": "If unintended, restrict recursion; patch DNS software; monitor for amplification abuse.",
        "port_http_service": "Ensure web server is patched; use WAF/reverse proxy; least privilege.",
        "port_https_service": "Same as HTTP; enforce TLS best practices and HSTS.",
        "port_http_alt": "Verify service is intended to be public; apply same hardening as primary web.",
        "port_https_alt": "Confirm certificate and TLS settings for alternate HTTPS port.",
        "port_scan_error": "Verify DNS, routing, and that the host allows your scan source.",
        "missing_csp": "Add Content-Security-Policy to restrict script and resource origins.",
        "missing_hsts": "Send Strict-Transport-Security on HTTPS responses with appropriate max-age.",
        "missing_xframe": "Set X-Frame-Options or CSP frame-ancestors to mitigate clickjacking.",
        "missing_xcontent_type": "Send X-Content-Type-Options: nosniff.",
        "served_over_http": "Redirect HTTP to HTTPS and deploy HSTS.",
        "http_fetch_failed": "Check URL, TLS trust store, and network path.",
        "robots_disallow": "Respect site policy; obtain written permission or use staging environments.",
        "injection_probe_unreachable": "Ensure the URL is reachable over HTTP/HTTPS from the scanner.",
        "injection_probe_error": "Retry later; check TLS settings (SCANNER_SSL_VERIFY) and connectivity.",
    }
    return tips.get(vuln_type, "Review OWASP guidance for this class of issue and apply defense in depth.")
