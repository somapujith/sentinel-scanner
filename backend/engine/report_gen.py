"""
Professional PDF security reports (ReportLab).
"""

from __future__ import annotations

from datetime import datetime, timezone
from io import BytesIO
from typing import Any
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle, PageBreak, Image

from . import risk_scorer

# Brand palette (dark header, accent, risk hues)
_PRIMARY = colors.HexColor("#0f172a")
_MUTED = colors.HexColor("#64748b")
_SURFACE = colors.HexColor("#f1f5f9")


def _risk_bg(risk: str) -> colors.Color:
    r = (risk or "").lower()
    if r == "critical":
        return colors.HexColor("#fef2f2")
    if r == "high":
        return colors.HexColor("#fff7ed")
    if r == "medium":
        return colors.HexColor("#fefce8")
    return colors.HexColor("#f0fdf4")


def _risk_hex(risk: str) -> str:
    r = (risk or "").lower()
    if r == "critical":
        return "#b91c1c"
    if r == "high":
        return "#c2410c"
    if r == "medium":
        return "#a16207"
    return "#15803d"


def _risk_border_color(risk: str) -> colors.Color:
    return colors.HexColor(_risk_hex(risk))


def _safe_float(x: Any, default: float = 0.0) -> float:
    """Avoid ValueError from bad JSON (e.g. non-numeric cvss) crashing PDF build."""
    if x is None or x == "":
        return default
    try:
        v = float(x)
        if v != v:  # NaN
            return default
        return v
    except (TypeError, ValueError, OverflowError):
        return default


def build_pdf_report(scan_id: str, target: str, findings: list[dict[str, Any]]) -> bytes:
    """Build a styled PDF; returns raw bytes."""
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=1.5 * cm,
        leftMargin=1.5 * cm,
        topMargin=1.2 * cm,
        bottomMargin=1.2 * cm,
        title="Security scan report",
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "CoverTitle",
        parent=styles["Heading1"],
        fontSize=22,
        textColor=colors.white,
        alignment=TA_CENTER,
        spaceAfter=6,
        fontName="Helvetica-Bold",
    )
    date_style = ParagraphStyle(
        "DateStamp",
        parent=styles["Normal"],
        fontSize=9,
        textColor=colors.HexColor("#64748b"),
        alignment=TA_CENTER,
        spaceAfter=0,
    )
    h2 = ParagraphStyle(
        "H2",
        parent=styles["Heading2"],
        fontSize=14,
        textColor=_PRIMARY,
        spaceBefore=14,
        spaceAfter=8,
        fontName="Helvetica-Bold",
    )
    body = ParagraphStyle(
        "Body",
        parent=styles["Normal"],
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#334155"),
    )
    small = ParagraphStyle(
        "Small",
        parent=styles["Normal"],
        fontSize=8,
        leading=10,
        textColor=_MUTED,
    )
    meta_key = ParagraphStyle("MetaK", parent=body, fontName="Helvetica-Bold", fontSize=9)
    meta_val = ParagraphStyle("MetaV", parent=body, fontSize=9)
    gauge_lbl = ParagraphStyle(
        "GaugeLbl",
        parent=styles["Normal"],
        fontSize=9,
        leading=11,
        textColor=_PRIMARY,
        fontName="Helvetica-Bold",
        spaceBefore=0,
        spaceAfter=0,
    )
    gauge_val = ParagraphStyle(
        "GaugeVal",
        parent=body,
        fontSize=9,
        leading=12,
        spaceBefore=2,
        spaceAfter=0,
    )

    story: list = []
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")

    # --- Cover Page ---
    story.append(Spacer(1, 5 * cm))
    
    import os
    # SVG unsupported natively, falling back to text
    logo_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "public", "logo-sentinel-lockup.svg"))
    
    story.append(Paragraph("<b>Sentinel</b><font color='#94a3b8'>Scanner</font>", ParagraphStyle("Logo", parent=title_style, fontSize=42, leading=48, spaceAfter=20)))
        
    story.append(Spacer(1, 1 * cm))
    
    cover_w = A4[0] - 3 * cm
    cover_tbl = Table(
        [
            [
                Paragraph(
                    "<b>SECURITY ASSESSMENT REPORT</b><br/><font size=9 color='#94a3b8'>"
                    + escape("Detailed Vulnerability & Posture Analysis")
                    + "</font>",
                    title_style,
                )
            ]
        ],
        colWidths=[cover_w],
        rowHeights=[3.5 * cm],
    )
    cover_tbl.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), _PRIMARY),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ]
        )
    )
    story.append(cover_tbl)
    story.append(Spacer(1, 2 * cm))
    story.append(Paragraph(f"<b>Target:</b> <font color='#1e293b'>{escape(target)}</font>", ParagraphStyle("CoverTarget", parent=body, fontSize=14, alignment=TA_CENTER)))
    story.append(Paragraph(f"<b>Generated:</b> <font color='#64748b'>{escape(now)}</font>", ParagraphStyle("CoverDate", parent=body, fontSize=12, alignment=TA_CENTER)))
    story.append(PageBreak())

    # --- Executive Summary ---
    story.append(Paragraph("<b>EXECUTIVE SUMMARY</b>", h2))
    story.append(Spacer(1, 0.5 * cm))
    
    total_findings = len(findings)
    crit_high = sum(1 for f in findings if f.get("risk", "").lower() in ("critical", "high"))
    med_low = total_findings - crit_high

    exec_text = (
        f"This report presents the findings from an automated security assessment conducted against the "
        f"target infrastructure at <b>{escape(target)}</b>. The assessment simulated adversarial techniques to identify "
        f"misconfigurations, vulnerabilities, and information disclosure risks."
    )
    story.append(Paragraph(exec_text, body))
    story.append(Spacer(1, 0.3 * cm))
    
    risk_summary = (
        f"In total, the scanner identified <b>{total_findings}</b> security issues. "
        f"<b>{crit_high}</b> of these are rated as High or Critical severity and require immediate remediation. "
        f"The remaining {med_low} findings represent Medium, Low, or Informational issues."
    )
    story.append(Paragraph(risk_summary, body))
    story.append(Spacer(1, 1.5 * cm))
    
    # --- Metadata card ---
    meta_data = [
        [
            Paragraph("<b>Scan ID</b>", meta_key),
            Paragraph(escape(scan_id), meta_val),
        ],
        [
            Paragraph("<b>Target</b>", meta_key),
            Paragraph(escape(target), meta_val),
        ],
        [
            Paragraph("<b>Findings</b>", meta_key),
            Paragraph(str(len(findings)), meta_val),
        ],
    ]
    meta_tbl = Table(meta_data, colWidths=[3.2 * cm, cover_w - 3.2 * cm])
    meta_tbl.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), _SURFACE),
                ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
                ("INNERGRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#e2e8f0")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ]
        )
    )
    story.append(meta_tbl)
    story.append(Spacer(1, 0.5 * cm))

    # Use the same scoring system as the UI: 0–10 where 10 is best.
    score = risk_scorer.security_score(findings)

    # Match visual rhythm: gap below intro ≈ gap below "Executive summary" heading (~h2 spaceAfter)
    story.append(Spacer(1, 0.5 * cm))

    half = cover_w * 0.5
    gauge_tbl = Table(
        [
            [
                Paragraph("Security score", gauge_lbl),
                Paragraph("Risk distribution", gauge_lbl),
            ],
            [
                Paragraph(
                    f"<font size=17 color='#0ea5e9'><b>{score:.2f}</b></font> "
                    f"<font size=10 color='#64748b'>/ 10</font>",
                    gauge_val,
                ),
                Paragraph(_risk_summary_line(findings), gauge_val),
            ],
        ],
        colWidths=[half, half],
    )
    gauge_tbl.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
                ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
                ("VALIGN", (0, 0), (-1, 0), "BOTTOM"),
                ("VALIGN", (0, 1), (-1, 1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                ("LINEABOVE", (0, 1), (-1, 1), 0.25, colors.HexColor("#e2e8f0")),
                ("LINEBEFORE", (1, 0), (1, 1), 0.25, colors.HexColor("#e2e8f0")),
            ]
        )
    )
    story.append(gauge_tbl)
    story.append(Spacer(1, 0.5 * cm))

    # --- Findings overview table ---
    story.append(Paragraph("<b>Findings overview</b>", h2))
    if not findings:
        story.append(Paragraph("<i>No findings recorded for this scan.</i>", body))
    else:
        hdr = [
            Paragraph("<b>#</b>", small),
            Paragraph("<b>Risk</b>", small),
            Paragraph("<b>CVSS</b>", small),
            Paragraph("<b>Title</b>", small),
            Paragraph("<b>Type</b>", small),
        ]
        rows: list = [hdr]
        for i, f in enumerate(findings, 1):
            risk = (f.get("risk") or "?").upper()
            rh = _risk_hex(f.get("risk", ""))
            rows.append(
                [
                    Paragraph(str(i), small),
                    Paragraph(f'<font color="{rh}"><b>{escape(risk)}</b></font>', small),
                    Paragraph(f"{_safe_float(f.get('cvss'), 0.0):.1f}", small),
                    Paragraph(escape(_short(f.get("title") or f.get("type"), 120)), small),
                    Paragraph(escape(_short(f.get("type", ""), 40)), small),
                ]
            )
        ow = cover_w
        ft = Table(rows, colWidths=[0.9 * cm, 1.6 * cm, 1.1 * cm, ow - 5.5 * cm, 2.9 * cm])
        ft.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), _PRIMARY),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("FONTSIZE", (0, 0), (-1, 0), 8),
                    ("BOTTOMPADDING", (0, 0), (-1, 0), 8),
                    ("TOPPADDING", (0, 0), (-1, 0), 8),
                    ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#e2e8f0")),
                    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("LEFTPADDING", (0, 0), (-1, -1), 6),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                    ("TOPPADDING", (0, 1), (-1, -1), 6),
                    ("BOTTOMPADDING", (0, 1), (-1, -1), 6),
                ]
            )
        )
        # Color risk column background lightly per row
        for r in range(1, len(rows)):
            risk_name = findings[r - 1].get("risk", "")
            ft.setStyle(
                [
                    ("BACKGROUND", (1, r), (1, r), _risk_bg(risk_name)),
                ]
            )
        story.append(ft)

    story.append(Spacer(1, 0.6 * cm))
    story.append(Paragraph("<b>Detailed findings &amp; remediation</b>", h2))

    for i, f in enumerate(findings, 1):
        risk = f.get("risk", "")
        title = escape(f.get("title") or f.get("type") or "Finding")
        desc = escape(f.get("description") or "")
        aff = escape(f.get("affected_component") or "")
        ev = escape(f.get("evidence") or "")
        mit = escape(f.get("mitigation") or "")
        cvss = _safe_float(f.get("cvss"), 0.0)

        band_hex = _risk_hex(risk)
        detail = Table(
            [
                [
                    Table(
                        [[Paragraph(f"<b>{i}. {title}</b>", ParagraphStyle("DT", parent=body, fontSize=11, textColor=_PRIMARY))]],
                        colWidths=[cover_w - 0.35 * cm],
                    )
                ],
                [
                    Paragraph(
                        f"<font color='{band_hex}'><b>{escape(risk.upper())}</b></font> &nbsp; "
                        f"<font color='#64748b'>CVSS {cvss:.1f}</font>",
                        body,
                    )
                ],
                [Paragraph(f"<b>Description</b><br/>{desc or '—'}", body)],
                [Paragraph(f"<b>Affected</b><br/>{aff or '—'}", body)],
                [Paragraph(f"<b>Evidence</b><br/>{ev or '—'}", small)],
                [Paragraph(f"<b>Remediation</b><br/><font color='#0f766e'>{mit or '—'}</font>", body)],
            ],
            colWidths=[cover_w],
        )
        detail.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, -1), colors.white),
                    ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
                    ("LINEBEFORE", (0, 0), (0, -1), 4, _risk_border_color(risk)),
                    ("LEFTPADDING", (0, 0), (-1, -1), 10),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                    ("TOPPADDING", (0, 0), (-1, -1), 8),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ]
            )
        )
        story.append(detail)
        story.append(Spacer(1, 0.35 * cm))

    story.append(Spacer(1, 0.3 * cm))
    story.append(
        Paragraph(
            "<b>Remediation checklist</b><br/>"
            "☐ Prioritize critical / high items &nbsp; "
            "☐ Re-test after changes &nbsp; "
            "☐ Document risk acceptance where needed",
            body,
        )
    )
    story.append(Spacer(1, 0.4 * cm))
    story.append(
        Paragraph(
            "<font size=8 color='#94a3b8'>Generated by Vulnerability Scanner · For authorized use only. "
            "Automated scans may miss issues or produce false positives; validate results manually.</font>",
            small,
        )
    )

    try:
        doc.build(story)
    except Exception as e:  # noqa: BLE001 — surface as 500 with safe message
        raise RuntimeError(f"ReportLab PDF build failed: {e}") from e
    return buffer.getvalue()


def _short(s: str, max_len: int) -> str:
    s = s or ""
    if len(s) <= max_len:
        return s
    return s[: max_len - 1] + "…"


def _risk_summary_line(findings: list[dict[str, Any]]) -> str:
    counts: dict[str, int] = {}
    for f in findings:
        r = (f.get("risk") or "unknown").lower()
        counts[r] = counts.get(r, 0) + 1
    parts = [f"{k}: {v}" for k, v in sorted(counts.items())]
    return escape(", ".join(parts)) if parts else "—"


# Backwards compatibility
def build_pdf_placeholder(scan_id: str, target: str, findings: list[dict[str, Any]]) -> bytes:
    return build_pdf_report(scan_id, target, findings)
