"""
Live TCP connect scan of common service ports (socket, no nmap dependency).
Only reports ports that actually accept a connection.
"""

from __future__ import annotations

import socket
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Any

from scanner.targets import host_from_target

# (port, risk type key, human-readable service name)
PORT_CHECKS: list[tuple[int, str, str]] = [
    (21, "port_ftp_open", "FTP"),
    (22, "port_ssh_open", "SSH"),
    (23, "port_telnet_open", "Telnet"),
    (25, "port_smtp_open", "SMTP"),
    (53, "port_dns_open", "DNS"),
    (80, "port_http_service", "HTTP"),
    (110, "port_pop3_open", "POP3"),
    (135, "port_msrpc_open", "MSRPC"),
    (139, "port_netbios_open", "NetBIOS"),
    (143, "port_imap_open", "IMAP"),
    (443, "port_https_service", "HTTPS"),
    (445, "port_smb_exposed", "SMB"),
    (1433, "port_mssql_exposed", "MS SQL Server"),
    (3306, "port_db_exposed", "MySQL/MariaDB"),
    (3389, "port_rdp_exposed", "RDP"),
    (5432, "port_postgres_exposed", "PostgreSQL"),
    (5900, "port_vnc_open", "VNC"),
    (6379, "port_redis_exposed", "Redis"),
    (8080, "port_http_alt", "HTTP alternate"),
    (8443, "port_https_alt", "HTTPS alternate"),
    (9200, "port_elasticsearch_open", "Elasticsearch"),
    (27017, "port_mongo_exposed", "MongoDB"),
]

TIMEOUT_S = 1.8
MAX_WORKERS = 48


def _tcp_open(host: str, port: int) -> bool:
    try:
        with socket.create_connection((host, port), timeout=TIMEOUT_S):
            return True
    except OSError:
        return False


def _check_one(args: tuple[str, int, str, str]) -> dict[str, Any] | None:
    host, port, vtype, svc = args
    if _tcp_open(host, port):
        return {
            "type": vtype,
            "title": f"Open port {port} ({svc})",
            "description": f"A TCP connection to {host}:{port} succeeded. Exposed services increase attack surface; restrict with firewall or bind to loopback.",
            "affected_component": f"{host}:{port}/tcp",
            "evidence": f"socket.create_connection succeeded within {TIMEOUT_S}s",
        }
    return None


def run(target: str) -> list[dict[str, Any]]:
    host = host_from_target(target)
    if not host:
        return [
            {
                "type": "port_scan_error",
                "title": "Invalid target for port scan",
                "description": "Could not resolve a hostname or IP from the target.",
                "affected_component": target,
                "evidence": "empty or unparseable target",
            }
        ]

    try:
        socket.getaddrinfo(host, None)
    except OSError as e:
        return [
            {
                "type": "port_scan_error",
                "title": "Host resolution failed",
                "description": "DNS lookup or address parsing failed; port scan not run.",
                "affected_component": host,
                "evidence": str(e),
            }
        ]

    work = [(host, p, vtype, label) for p, vtype, label in PORT_CHECKS]
    findings: list[dict[str, Any]] = []

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as pool:
        futures = [pool.submit(_check_one, w) for w in work]
        for fut in as_completed(futures):
            try:
                row = fut.result()
                if row:
                    findings.append(row)
            except Exception:  # noqa: BLE001
                continue

    findings.sort(key=lambda x: x.get("affected_component", ""))
    return findings
