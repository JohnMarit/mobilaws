path = r"c:\Users\John\Desktop\Mobilaws\src\components\LearningHub.tsx"
with open(path, "r", encoding="utf-8") as f:
    s = f.read()
needle = "          ) : activeNav === 'learning' ? ("
a = s.find(needle)
b = s.find("          ) : null}")
assert a != -1 and b != -1, (a, b)
end_len = len("          ) : null}")
new_s = s[:a] + s[b + end_len :]
nav_start = new_s.find("        {/* Bottom Navigation — match app mobile tab bar */}")
nav_end = new_s.find("        {activeLesson && (", nav_start)
assert nav_start != -1 and nav_end != -1
new_s = new_s[:nav_start] + new_s[nav_end:]
with open(path, "w", encoding="utf-8") as f:
    f.write(new_s)
print("ok", len(s), "->", len(new_s))
