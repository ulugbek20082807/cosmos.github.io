import json
import datetime

transcript_path = "/Users/ulugbekrahmatullayev28gmail.com/.gemini/antigravity/brain/b6ef4d9e-1d96-4711-b7ee-0e59a74d9059/.system_generated/logs/transcript_full.jsonl"

sim_content = ""
real_content = ""

target_time = datetime.datetime(2026, 6, 22, 4, 20, 0, tzinfo=datetime.timezone.utc) # Give a small buffer

with open(transcript_path, 'r') as f:
    for line in f:
        try:
            entry = json.loads(line)
            # Find system messages or anything that gives us the time, or just use the event times if present
            # But transcript might not have explicit timestamps per line easily parseable?
            # Let's just track the last known state from file reads!
            if entry["type"] == "TOOL_RESPONSE" and entry["source"] == "SYSTEM":
                if "view_file" in entry.get("content", "") or "run_command" in entry.get("content", ""):
                    # Let's extract file reads
                    pass
            if "tool_calls" in entry:
                for call in entry["tool_calls"]:
                    name = call["function"]["name"]
                    args = call["function"]["arguments"]
                    if isinstance(args, str):
                        args = json.loads(args)
                    if name == "write_to_file":
                        target = args.get("TargetFile", "")
                        if "SimulationCanvas.jsx" in target:
                            sim_content = args.get("CodeContent", "")
                        elif "RealCosmos.jsx" in target:
                            real_content = args.get("CodeContent", "")
        except Exception as e:
            pass

with open("SimulationCanvas_old.jsx", "w") as f:
    f.write(sim_content)
with open("RealCosmos_old.jsx", "w") as f:
    f.write(real_content)

print(f"Simulation len: {len(sim_content)}, RealCosmos len: {len(real_content)}")
