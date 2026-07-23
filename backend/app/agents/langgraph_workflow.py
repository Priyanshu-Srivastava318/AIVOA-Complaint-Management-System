"""
Assembles the LangGraph StateGraph for complaint intake.

Flow (mirrors a real QMS triage pipeline):

    extract_fields
          |
    completeness_checker
          |
    classify_risk
          |
    detect_duplicates
          |
    recommend_root_cause
          |
    recommend_capa
          |
    complaint_summary
          |
         END

Each node only writes the keys it owns, and LangGraph merges partial dict
updates into the shared state automatically.

NOTE: node IDs must NOT match any key in ComplaintAgentState (LangGraph raises
"'<node>' is already being used as a state key" otherwise) -- that's why nodes
here are named e.g. "classify_risk" rather than "risk_classification", even
though the state field they write to IS called risk_classification.
"""
from langgraph.graph import StateGraph, END

from app.agents.nodes import (
    ComplaintAgentState,
    extract_fields_node,
    completeness_checker_node,
    risk_classification_node,
    duplicate_detection_node,
    root_cause_node,
    capa_recommendation_node,
    summary_node,
)


def build_complaint_graph():
    graph = StateGraph(ComplaintAgentState)

    graph.add_node("extract_fields", extract_fields_node)
    graph.add_node("completeness_checker", completeness_checker_node)
    graph.add_node("classify_risk", risk_classification_node)
    graph.add_node("detect_duplicates", duplicate_detection_node)
    graph.add_node("recommend_root_cause", root_cause_node)
    graph.add_node("recommend_capa", capa_recommendation_node)
    graph.add_node("complaint_summary", summary_node)

    graph.set_entry_point("extract_fields")
    graph.add_edge("extract_fields", "completeness_checker")
    graph.add_edge("completeness_checker", "classify_risk")
    graph.add_edge("classify_risk", "detect_duplicates")
    graph.add_edge("detect_duplicates", "recommend_root_cause")
    graph.add_edge("recommend_root_cause", "recommend_capa")
    graph.add_edge("recommend_capa", "complaint_summary")
    graph.add_edge("complaint_summary", END)

    return graph.compile()


# Compiled once at import time and reused across requests (LangGraph graphs are stateless/reentrant).
complaint_agent = build_complaint_graph()


def run_complaint_intake(source_text: str, existing_complaints: list[dict]) -> ComplaintAgentState:
    """Convenience entry point used by the /ai/extract route."""
    initial_state: ComplaintAgentState = {
        "source_text": source_text,
        "existing_complaints": existing_complaints,
        "trace": [],
    }
    final_state = complaint_agent.invoke(initial_state)
    return final_state