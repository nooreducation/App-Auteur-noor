
$path = "h:/Antigravity/App Auteur noor/src/pages/CourseEditor.jsx"
$lines = Get-Content $path
$start = 933 # 0-indexed line 934
$end = 937   # 0-indexed line 938
$newLines = @(
    "                                            </Reorder.Group>",
    "                                        </div>",
    "                                    );",
    "                                })",
    "                            </div>",
    "                        ))}"
)

# Splice the new lines into the array
$result = $lines[0..($start-1)] + $newLines + $lines[($end+1)..($lines.Count-1)]
$result | Set-Content $path -Encoding UTF8
