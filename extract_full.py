import json

transcript_path = "/Users/ulugbekrahmatullayev28gmail.com/.gemini/antigravity/brain/b6ef4d9e-1d96-4711-b7ee-0e59a74d9059/.system_generated/logs/transcript_full.jsonl"

for line in open(transcript_path, 'r'):
    try:
        entry = json.loads(line)
        if entry["type"] == "TOOL_RESPONSE" and entry["source"] == "SYSTEM":
            content = str(entry.get("content", ""))
            if "SimulationCanvas.jsx" in content and "function SimulationCanvas" in content:
                with open("SimulationCanvas_last_read.txt", "w") as f:
                    f.write(content)
    except: pass
