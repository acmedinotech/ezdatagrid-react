
## Keyboard

- on-row:
    - TAB -> goes into first cell
    - UP | DOWN -> goto: prev row | next row
- on-cell:
    - TAB -> goto: next cell; next row
        - on-focus: @bug desired behavior: move focus to first control;; actual: interferes with modal focus
    - SHIFT+TAB -> goto: prev cell; prev row
    - UP | DOWN -> goto: (prev row | next row) -> goto: (corresponding cell)
    - 