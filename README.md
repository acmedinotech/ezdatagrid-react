# EZDataGrid (EZDG, ezdg)

A lightweight, fast, and flexible dynamic datagrid display & editor that works on the following basic concepts:

- each **table** represents a specific **entity** and is defined by a set of **columnDefinitions** (_colDefs_)
- each **entity** is attached to a **dataStore** that can:
  1. create an entity
  2. read a page of entities (or single entity)
  3. update a single entity
  4. delete a single entity

## MVP Todos

- [ ] cell: on-click/hover buttonbar for copy/misc
- [x] `rowData.___flash=created|updated|deleted|error -> data-ezdg-flash`
  - [x] data-ezdg-flash should trigger a css animation
  - [x] remove \_\_\_flash during any row-mutation dataStore operations
- [x] rename `component.toolbars.tsx -> component.rowTools.tsx`
  - [x] extract remaining buttons to top level
  - [ ] create SaveDataStoreButton that goes from `default -> 🟡 -> [🟢 | 🔴] -> default`
- [ ] 🔎 search/pagination
  - [x] 🐞 `isArray` being ignored in control render
  - [x] filtering
  - [ ] sorting
- [ ] 👩‍💻 UI polish
  - [ ] create 2-4 new themes
  - [ ] polish themes
  - [ ] make tables a tiny bit cuter
  - [ ] define/implement intuitive keyboard shortcuts
  - [ ] RESPONSIVE LAYOUT!
  - [ ] mobile-friendly?
