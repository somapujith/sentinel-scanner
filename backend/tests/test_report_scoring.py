import pytest


def test_security_score_inverts_aggregate():
    from engine import risk_scorer

    findings = [
        {"cvss": 2.0, "risk": "low", "title": "t", "type": "port_http_service"},
        {"cvss": 4.0, "risk": "medium", "title": "t2", "type": "missing_csp"},
    ]

    # aggregate_score() == (2 + 4) / 2 == 3.0 => security score should be 7.0
    assert risk_scorer.security_score(findings) == pytest.approx(7.0)


def test_security_score_empty_is_perfect():
    from engine import risk_scorer

    assert risk_scorer.security_score([]) == pytest.approx(10.0)


def test_build_pdf_report_does_not_call_aggregate_score_directly(monkeypatch):
    # The PDF should use the current "security score" (health) system, not the legacy
    # direct aggregate CVSS average.
    import engine.report_gen as report_gen

    def _boom(_findings):
        raise AssertionError("aggregate_score should not be called directly from report_gen")

    monkeypatch.setattr(report_gen, "aggregate_score", _boom, raising=False)

    findings = [{"cvss": 2.0, "risk": "low", "title": "t", "type": "port_http_service"}]
    out = report_gen.build_pdf_report("scan-1", "example.com", findings)

    assert isinstance(out, (bytes, bytearray))
    assert bytes(out).startswith(b"%PDF")


def test_build_pdf_report_empty_findings_still_builds():
    import engine.report_gen as report_gen

    out = report_gen.build_pdf_report("scan-empty", "example.com", [])
    assert bytes(out).startswith(b"%PDF")
