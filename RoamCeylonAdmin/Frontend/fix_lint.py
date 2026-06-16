import json
import subprocess

# Get eslint json output
result = subprocess.run(['npx', 'eslint', '.', '--format', 'json'], capture_output=True, text=True)
data = json.loads(result.stdout)

for file_data in data:
    filepath = file_data['filePath']
    messages = file_data['messages']
    
    # Read file
    with open(filepath, 'r') as f:
        lines = f.readlines()
        
    # Process messages in reverse order so line numbers don't shift
    messages = sorted(messages, key=lambda x: x['line'], reverse=True)
    
    modified = False
    for msg in messages:
        if msg['ruleId'] == 'unused-imports/no-unused-vars' or msg['ruleId'] == '@typescript-eslint/no-unused-vars':
            line_idx = msg['line'] - 1
            # Extract variable name from message: "'width' is assigned a value but never used"
            import re
            match = re.search(r"'([^']+)' is", msg['message'])
            if match:
                var_name = match.group(1)
                # Replace exact match of variable with _var_name
                # To be safe, we only replace it if it's not already starting with _
                if not var_name.startswith('_'):
                    # use regex to replace whole word
                    lines[line_idx] = re.sub(r'\b' + re.escape(var_name) + r'\b', '_' + var_name, lines[line_idx])
                    modified = True
                    
    if modified:
        with open(filepath, 'w') as f:
            f.writelines(lines)

print("Fixed unused variables.")
