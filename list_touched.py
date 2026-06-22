import json
import datetime

transcript_path = "/Users/ulugbekrahmatullayev28gmail.com/.gemini/antigravity/brain/b6ef4d9e-1d96-4711-b7ee-0e59a74d9059/.system_generated/logs/transcript_full.jsonl"

with open(transcript_path, 'r') as f:
    for line in f:
        try:
            entry = json.loads(line)
            time_str = entry.get("created_at", "")
            if not time_str: continue
            
            entry_time = datetime.datetime.strptime(time_str, "%Y-%m-%dT%H:%M:%SZ")
            if entry_time > datetime.datetime(2026, 6, 22, 4, 15, 0):
                break
                
            if "tool_calls" in entry:
                for call in entry["tool_calls"]:
                    name = call["function"]["name"]
                    args = call["function"]["arguments"]
                    if isinstance(args, str):
                        args = json.loads(args)
                        
                    if name in ["write_to_file", "replace_file_content", "multi_replace_file_content"]:
                        target = args.get("TargetFile", "")
                        print(f"[{time_str}] Modified: {target}")
        except Exception as e:
            pass
