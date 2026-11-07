import pathlib
p = pathlib.Path("src/app/page.tsx")
s = p.read_text()
# Replace within dateRange function: from the function def to the closing of switch? Simpler replace all 'now' with 'n' inside the dateRange body.
start = s.index("function dateRange")
end = s.index("const TX_FILTERS")
func = s[start:end]
func2 = func.replace("now", "n")
s = s[:start] + func2 + s[end:]
# add now state
s = s.replace("  const [search, setSearch] = useState(\"\");",
              "  const [now, setNow] = useState<Date | null>(null);\n  useEffect(() => setNow(new Date()), []);\n  const [search, setSearch] = useState(\"\");")
# update call
s = s.replace("const { from, to } = useMemo(() => dateRange(datePreset, customFrom, customTo), [datePreset, customFrom, customTo]);",
              "const { from, to } = useMemo(() => dateRange(datePreset, customFrom, customTo, now), [datePreset, customFrom, customTo, now]);")
p.write_text(s)
print("done")