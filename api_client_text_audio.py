import argparse
import base64
from pathlib import Path

import requests


def main():
    parser = argparse.ArgumentParser(
        description="Client for the speech-to-speech translation API"
    )
    parser.add_argument("--server", default="http://172.16.41.109:8000")
    parser.add_argument("--audio", required=True)
    parser.add_argument("--source", required=True)
    parser.add_argument("--target", required=True)
    parser.add_argument("--output", default="translated_output.wav")
    parser.add_argument("--api-key", default="")
    args = parser.parse_args()

    endpoint = args.server.rstrip("/") + "/translate"

    headers = {}
    if args.api_key:
        headers["X-API-Key"] = args.api_key

    audio_path = Path(args.audio)

    with audio_path.open("rb") as f:
        response = requests.post(
            endpoint,
            files={
                "audio": (
                    audio_path.name,
                    f,
                    "application/octet-stream",
                )
            },
            data={
                "source": args.source,
                "target": args.target,
            },
            headers=headers,
            timeout=None,
        )

    response.raise_for_status()
    data = response.json()

    print("\nSource text:")
    print(data.get("source_text", ""))

    if data.get("pivot_text"):
        print("\nEnglish pivot:")
        print(data["pivot_text"])

    print("\nTranslated text:")
    print(data.get("translated_text", ""))

    print("\nTTS engine:")
    print(data.get("tts_engine", ""))

    print("\nProcessing seconds:")
    print(data.get("processing_seconds", ""))

    audio_bytes = base64.b64decode(data["audio_base64"])
    Path(args.output).write_bytes(audio_bytes)

    print("\nTranslated audio saved:")
    print(args.output)


if __name__ == "__main__":
    main()
