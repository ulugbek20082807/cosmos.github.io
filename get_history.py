import json

transcript_path = "/Users/ulugbekrahmatullayev28gmail.com/.gemini/antigravity/brain/b6ef4d9e-1d96-4711-b7ee-0e59a74d9059/.system_generated/logs/transcript_full.jsonl"

sim_states = []
real_states = []

with open(transcript_path, 'r') as f:
    for line in f:
        try:
            entry = json.loads(line)
            
            # Find TOOL_RESPONSE for view_file
            if entry["type"] == "TOOL_RESPONSE" and "tool_calls" not in entry:
                # Need to match this to a view_file request, which is hard.
                # Let's just look for file contents that contain "SimulationCanvas"
                content = str(entry.get("content", ""))
                if "function SimulationCanvas" in content and "import" in content:
                    sim_states.append(content)
                if "function RealCosmos" in content and "import" in content:
                    real_states.append(content)
                    
            if "tool_calls" in entry:
                for call in entry["tool_calls"]:
                    name = call["function"]["name"]
                    args = call["function"]["arguments"]
                    if isinstance(args, str):
                        args = json.loads(args)
                        
                    if name in ["write_to_file", "replace_file_content", "multi_replace_file_content"]:
                        target = args.get("TargetFile", "")
                        if "SimulationCanvas.jsx" in target:
                            sim_states.append({"name": name, "args": args})
                        elif "RealCosmos.jsx" in target:
                            real_states.append({"name": name, "args": args})
        except Exception as e:
            pass

print(f"Simulation changes: {len(sim_states)}")
print(f"RealCosmos changes: {len(real_states)}")
