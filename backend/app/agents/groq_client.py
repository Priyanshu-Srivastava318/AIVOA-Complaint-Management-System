"""
Thin wrapper around Groq's OpenAI-compatible chat completion API.

We deliberately avoid a heavy SDK dependency issue by using the official
`groq` python package. Two models are used across the app:

- GROQ_MODEL_FAST ("llama-3.1-8b-instant" -- see config.py note on gemma2-9b-it deprecation): fast structured-field extraction.
- GROQ_MODEL_REASONING ("llama-3.3-70b-versatile"): longer-context reasoning
  for summaries, root-cause, CAPA recommendations, and the chat assistant.
"""
import json
import logging
from typing import Optional

from groq import Groq

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

_client: Optional[Groq] = None


def get_client() -> Groq:
    global _client
    if _client is None:
        if not settings.GROQ_API_KEY:
            raise RuntimeError(
                "GROQ_API_KEY is not set. Create a token at "
                "https://console.groq.com/keys and put it in backend/.env"
            )
        _client = Groq(api_key=settings.GROQ_API_KEY)
    return _client


def run_completion(system_prompt: str, user_prompt: str, model: str,
                    json_mode: bool = False, temperature: float = 0.2) -> str:
    """Run a single-turn completion and return the raw text response."""
    client = get_client()
    kwargs = {}
    if json_mode:
        kwargs["response_format"] = {"type": "json_object"}

    completion = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        temperature=temperature,
        max_tokens=2048,
        **kwargs,
    )
    return completion.choices[0].message.content


def run_json_completion(system_prompt: str, user_prompt: str, model: str) -> dict:
    """Run a completion and parse it as JSON, with a defensive fallback."""
    raw = run_completion(system_prompt, user_prompt, model, json_mode=True)
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        # Defensive: some models wrap JSON in markdown fences despite instructions
        cleaned = raw.strip().strip("```json").strip("```").strip()
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            logger.error("Failed to parse JSON from Groq response: %s", raw)
            return {}


def run_chat_completion(messages: list[dict], model: str, temperature: float = 0.4) -> str:
    """Multi-turn chat completion for the AI Assistant chat panel."""
    client = get_client()
    completion = client.chat.completions.create(
        model=model,
        messages=messages,
        temperature=temperature,
        max_tokens=1024,
    )
    return completion.choices[0].message.content
