import json

transcript_path = "/Users/ulugbekrahmatullayev28gmail.com/.gemini/antigravity/brain/b6ef4d9e-1d96-4711-b7ee-0e59a74d9059/.system_generated/logs/transcript_full.jsonl"

with open(transcript_path, 'r') as f:
    for line in f:
        try:
            entry = json.loads(line)
            if "tool_calls" in entry:
                for call in entry["tool_calls"]:
                    if call["function"]["name"] == "write_to_file":
                        args = call["function"]["arguments"]
                        if isinstance(args, str):
                            args = json.loads(args)
                        if "SimulationCanvas.jsx" in args.get("TargetFile", ""):
                            print(f"Write at: {entry.get('created_at', 'unknown')}")
        except Exception as e:
            pass
