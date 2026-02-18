
import os

filepath = 'h:/Antigravity/App Auteur noor/src/pages/CourseEditor.jsx'
with open(filepath, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Lines are 0-indexed in python, so 934-938 are 933-937
start_idx = 933
end_idx = 938 # 933, 934, 935, 936, 937

# Verify content before replacing
if '</Reorder.Group>' in lines[start_idx]:
    lines[start_idx:end_idx] = [
        '                                            </Reorder.Group>\n',
        '                                        </div>\n',
        '                                    );\n',
        '                                })}\n',
        '                            </div>\n',
        '                        ))}\n'
    ]
    with open(filepath, 'w', encoding='utf-8') as f:
        f.writelines(lines)
    print("Successfully fixed!")
else:
    print(f"Content mismatch at line {start_idx+1}: {lines[start_idx].strip()}")
