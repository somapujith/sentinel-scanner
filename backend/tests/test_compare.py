from engine.compare import compare_findings, finding_key


def test_finding_key_stable():
    f = {"type": "ssl", "title": "Weak cipher", "affected_component": "443"}
    assert finding_key(f) == "ssl|Weak cipher|443"


def test_compare_findings_diff():
    left = [{"type": "a", "title": "t1", "affected_component": "x"}]
    right = [{"type": "b", "title": "t2", "affected_component": "y"}]
    out = compare_findings(left, right)
    assert len(out["only_left"]) == 1
    assert len(out["only_right"]) == 1
    assert out["counts"]["unchanged"] == 0


def test_compare_findings_overlap():
    shared = {"type": "port", "title": "Open", "affected_component": "80"}
    out = compare_findings([shared], [dict(shared)])
    assert out["counts"]["unchanged"] == 1
    assert out["counts"]["only_left"] == 0
