type Column<T> = { key: string; label: string; format?: (row: T) => string }

export function exportToCsv<T extends Record<string, unknown>>(
    filename: string,
    rows: T[],
    columns: Column<T>[]
): void {
    const header = columns.map((c) => `"${c.label}"`).join(",")
    const body = rows.map((row) =>
        columns
            .map((c) => {
                const val = c.format ? c.format(row) : (row[c.key] ?? "")
                return `"${String(val).replace(/"/g, '""')}"`
            })
            .join(",")
    )
    const csv = [header, ...body].join("\n")
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${filename}.csv`
    a.click()
    URL.revokeObjectURL(url)
}
