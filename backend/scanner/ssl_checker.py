"""
Live TLS inspection: certificate validity/expiry, negotiated protocol, cipher suite.
"""

from __future__ import annotations

import socket
import ssl
from datetime import datetime, timezone
from typing import Any

from scanner.targets import host_from_target, port_from_target

WEAK_TLS = frozenset({"TLSv1", "TLSv1.1", "SSLv2", "SSLv3"})


def run(target: str) -> list[dict[str, Any]]:
    host = host_from_target(target)
    if not host:
        return [
            {
                "type": "ssl_connection_failed",
                "title": "Invalid target for TLS check",
                "description": "Could not resolve a hostname for TLS inspection.",
                "affected_component": target,
                "evidence": "unparseable target",
            }
        ]

    port = port_from_target(target, 443)
    findings: list[dict[str, Any]] = []

    ctx = ssl.create_default_context()
    try:
        with socket.create_connection((host, port), timeout=12) as sock:
            with ctx.wrap_socket(sock, server_hostname=host) as ssock:
                cert_bin = ssock.getpeercert(binary_form=True)
                if not cert_bin:
                    findings.append(
                        {
                            "type": "ssl_no_certificate",
                            "title": "No peer certificate presented",
                            "description": "The server did not present an X.509 certificate in the handshake.",
                            "affected_component": f"{host}:{port}",
                            "evidence": "getpeercert(binary=True) empty",
                        }
                    )
                else:
                    cert = ssock.getpeercert()
                    if cert:
                        not_after = cert.get("notAfter")
                        if not_after:
                            try:
                                exp = ssl.cert_time_to_seconds(not_after)
                                exp_dt = datetime.fromtimestamp(exp, tz=timezone.utc)
                                now = datetime.now(timezone.utc)
                                days_left = (exp_dt - now).days
                                if days_left < 0:
                                    findings.append(
                                        {
                                            "type": "ssl_expired",
                                            "title": "TLS certificate expired",
                                            "description": f"The server certificate expired on {exp_dt.date().isoformat()} UTC.",
                                            "affected_component": f"{host}:{port}",
                                            "evidence": f"notAfter={not_after}",
                                        }
                                    )
                                elif days_left <= 30:
                                    findings.append(
                                        {
                                            "type": "ssl_expiring_soon",
                                            "title": "TLS certificate expiring soon",
                                            "description": f"Certificate expires in {days_left} days ({exp_dt.date().isoformat()} UTC).",
                                            "affected_component": f"{host}:{port}",
                                            "evidence": f"notAfter={not_after}",
                                        }
                                    )
                            except (ValueError, OSError):
                                pass

                ver = ssock.version() or ""
                if ver in WEAK_TLS:
                    findings.append(
                        {
                            "type": "ssl_weak_protocol",
                            "title": f"Weak TLS protocol negotiated ({ver})",
                            "description": "TLS 1.0/1.1 and SSL are deprecated; use TLS 1.2+.",
                            "affected_component": f"{host}:{port}",
                            "evidence": f"negotiated version: {ver}",
                        }
                    )

                cipher = ssock.cipher()
                if cipher and len(cipher) >= 3:
                    name, tls_ver, bits = cipher[0], cipher[1], cipher[2]
                    ev = f"{name} {tls_ver} {bits} bits"
                    if isinstance(bits, int) and bits < 128:
                        findings.append(
                            {
                                "type": "ssl_weak_cipher",
                                "title": "Weak cipher suite",
                                "description": f"Negotiated cipher uses {bits}-bit keys — prefer modern AEAD suites.",
                                "affected_component": f"{host}:{port}",
                                "evidence": ev,
                            }
                        )
                    elif "NULL" in name.upper() or "EXPORT" in name.upper() or "RC4" in name.upper():
                        findings.append(
                            {
                                "type": "ssl_weak_cipher",
                                "title": "Insecure cipher suite",
                                "description": f"Negotiated cipher {name} is considered weak.",
                                "affected_component": f"{host}:{port}",
                                "evidence": ev,
                            }
                        )
    except ssl.SSLError as e:
        findings.append(
            {
                "type": "ssl_connection_failed",
                "title": "TLS handshake failed",
                "description": "Could not complete a TLS handshake with the target.",
                "affected_component": f"{host}:{port}",
                "evidence": str(e),
            }
        )
    except OSError as e:
        findings.append(
            {
                "type": "ssl_connection_failed",
                "title": "Could not connect for TLS inspection",
                "description": "No TCP connection to the TLS port (service down, firewall, or wrong port).",
                "affected_component": f"{host}:{port}",
                "evidence": str(e),
            }
        )

    if not findings:
        findings.append(
            {
                "type": "ssl_ok",
                "title": "TLS handshake successful",
                "description": "A TLS connection was established; no certificate expiry or weak protocol issues were detected in this check.",
                "affected_component": f"{host}:{port}",
                "evidence": "ssl.create_default_context() handshake completed",
            }
        )

    return findings
