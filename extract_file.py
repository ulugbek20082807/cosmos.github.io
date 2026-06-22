import json
import datetime

transcript_path = "/Users/ulugbekrahmatullayev28gmail.com/.gemini/antigravity/brain/b6ef4d9e-1d96-4711-b7ee-0e59a74d9059/.system_generated/logs/transcript_full.jsonl"

content_sim = None

with open(transcript_path, 'r') as f:
    for line in f:
        try:
            entry = json.loads(line)
            time_str = entry.get("created_at", "")
            if not time_str: continue
            
            entry_time = datetime.datetime.strptime(time_str, "%Y-%m-%dT%H:%M:%SZ")
            if entry_time > datetime.datetime(2026, 6, 22, 4, 16, 0):
                break
                
            # Check TOOL_RESPONSE for view_file
            if entry["type"] == "TOOL_RESPONSE" and entry["source"] == "SYSTEM":
                content = entry.get("content", "")
                if "SimulationCanvas.jsx" in content and "function SimulationCanvas" in content:
                    # It's a view_file response
                    content_sim = content
                    
            # Check write_to_file
            if "tool_calls" in entry:
                for call in entry["tool_calls"]:
                    if call["function"]["name"] == "write_to_file":
                        args = call["function"]["arguments"]
                        if isinstance(args, str):
                            args = json.loads(args)
                        if "SimulationCanvas.jsx" in args.get("TargetFile", ""):
                            content_sim = args.get("CodeContent", "")
        except Exception as e:
            pass

if content_sim:
    with open("SimulationCanvas_0415.jsx", "w") as f:
        f.write(content_sim)
    print("Extracted SimulationCanvas!")
else:
    print("Not found.")
