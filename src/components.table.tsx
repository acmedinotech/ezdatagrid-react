import { createContext, useEffect, useRef, useState } from 'react';
import { TableAddRowButton } from './components.rowTools';
import { Cell, CellEdit, CellEditor } from './components.cell';
import { Select } from './components.formControls';
import { Row, RowEditor, useRowState } from './components.row';
import {
	asHtmlElement,
	collectFormRowData,
	LogicalOperatorOptions,
	rollMapIntoFlatKeys,
	SortOptions,
	unrollFlatMapKeys,
} from './helpers';
import styles from './styles.module.scss';
import {
	ColumnDef,
	DataStore,
	EMPTY_ROW_CONTEXT,
	EZDataGridProps,
	EZDGTableContext,
	PaginationParams,
	ROW_SIDEBAR_COLS,
	SearchParams,
	StructEZDataGridState,
	StructRecordAny,
} from './types';
import { Modal } from './components.utility';
import { useBulkEditor } from './components.bulkEditor';

export const getOverlayedColumnDefs = (
	colDefs: ColumnDef[],
	tstate: StructEZDataGridState
) => {
	const overlayDefs = tstate.uiOverlays.colMap;
	const newColDefs = colDefs.map((colDef) => {
		const ncDef = { ...colDef };
		const ncSpan = overlayDefs[ncDef.id]?.colSpan;
		if (ncSpan) {
			ncDef.colSpan = ncSpan;
		}
		return ncDef;
	});
	return newColDefs;
};

export const getColumnResizer = (
	colsMap: Record<string, ColumnDef>,
	context: EZDGTableContext
) => {
	const colIndex: Record<string, number> = {};
	const indexCol: Record<number, string> = {};

	let _cols = 0;
	for (const val of Object.values(colsMap)) {
		const id = val.id;
		colIndex[id] = _cols++;
		indexCol[_cols - 1] = id;
	}

	const resizer = {
		getAvailableNeighborColSpan: (colId: string, dir: number) => {
			const idx = colIndex[colId];
			const neighbor = indexCol[idx + dir] ?? '';
			return colsMap[neighbor]?.colSpan ?? 1;
		},
		expand: (
			colId: string,
			dir: number,
			keyNormalizer = (s: string) => s
		) => {
			const idx = colIndex[colId];
			const neighbor = indexCol[idx + dir];

			let nColSpan = colsMap[neighbor].colSpan as number;
			let colSpan = colsMap[colId].colSpan as number;

			const amtExpand = Math.abs(dir);
			nColSpan -= amtExpand;
			colSpan += amtExpand;

			const overlays = context.getUiOverlays();
			let newNDef = overlays.colMap[neighbor] ?? {};
			newNDef.colSpan = nColSpan;
			let newCDef = overlays.colMap[colId] ?? {};
			newCDef.colSpan = colSpan;
			context.setUiOverlays({
				...overlays,
				colMap: {
					...overlays.colMap,
					[keyNormalizer(colId)]: newCDef,
					[keyNormalizer(neighbor)]: newNDef,
				},
			});
		},
	};
	return resizer;
};

export const EZDGTableContextProvider = createContext<EZDGTableContext>({
	dataStore: undefined as unknown as DataStore,
	refetchPage: function (searchParams?: SearchParams): Promise<void> {
		throw new Error('Function not implemented.');
	},
	paginate: function (params: PaginationParams): Promise<void> {
		throw new Error('Function not implemented.');
	},
	getColumnsWidth: function (): number {
		return -1;
	},
	getColumnDefs: function (): Record<string, ColumnDef> {
		throw new Error('Function not implemented.');
	},
	getHiddenValues: () => ({}),
	addNewRow: () => { },
	setUiOverlays: () => { },
	getUiOverlays: () => {
		throw new Error('Function not implemented.');
	},
});

export const TableHeaderToolbarRow = ({
	colsMap,
	tableContext,
	totalColumns,
}: {
	colsMap: Record<string, ColumnDef>;
	tableContext: EZDGTableContext;
	totalColumns: number;
}) => {
	const [tbarState, setTbarState] = useState({
		isExpanded: false,
		searchParams: { filters: {}, sorts: {}, operators: {} } as SearchParams,
		formData: {} as StructRecordAny,
	});

	const { isExpanded, searchParams, formData } = tbarState;
	const _setState = (st: Partial<typeof tbarState>) => {
		setTbarState((cur) => {
			return { ...cur, ...st };
		});
	};

	// console.log('TableHeaderToolbarRow: ', { formData, searchParams });

	const normColsMap: typeof colsMap = {};
	for (const key in colsMap) {
		const newId = `filters.${key}`;
		const newDef = {
			...colsMap[key],
			id: newId,
			label: colsMap[key].label ?? key,
		};
		if (newDef.optionsList) {
			newDef.isArray = true;
			newDef.optionsList = {
				...newDef.optionsList,
				type: 'dropdown',
			};
		}
		// @todo convert single-line text to multiline?
		normColsMap[newId] = newDef;
	}

	const CellHeaderRowTools = () => {
		return (
			<Cell colSpan={ROW_SIDEBAR_COLS}>
				<button
					data-ezdg-action="$tableheader-expand"
					title="$tableheader-expand"
					onClick={() => {
						_setState({
							isExpanded: !isExpanded,
						});
					}}
				>
					{isExpanded ? '⬆️' : '🔍'}
				</button>
			</Cell>
		);
	};

	const Sort = ({ colId, def }: { colId: string; def: ColumnDef }) => {
		if (!def.searchOptions?.isSort) return null;
		const name = `sorts.${colId}`;
		return (
			<small data-ezdg-flex>
				<Select
					name={name}
					optionsMap={SortOptions}
					defaultValue={formData[name] ?? ''}
				></Select>
			</small>
		);
	};

	const colResizer = getColumnResizer(normColsMap, tableContext);
	const keyNormalizer = (s: string) => s.substring(`filters.`.length);

	const ColumnModifiers = ({ def }: { def: ColumnDef }) => {
		if (!isExpanded) return null;
		return (
			<div data-ezdg-flex>
				<button
					disabled={
						colResizer.getAvailableNeighborColSpan(def.id, -1) < 2
					}
					onClick={() => {
						colResizer.expand(def.id, -1, keyNormalizer);
					}}
				>
					⇤
				</button>
				<code>{def.colSpan ?? 1}</code>
				<button
					disabled={
						colResizer.getAvailableNeighborColSpan(def.id, 1) < 2
					}
					onClick={() => {
						colResizer.expand(def.id, 1, keyNormalizer);
					}}
				>
					⇥
				</button>
				<Sort def={def} colId={def.id} />
			</div>
		);
	};

	const CellHeaderView = ({ def }: { def: ColumnDef }) => {
		return (
			<CellEdit
				key={def.id}
				{...def}
				rowContext={EMPTY_ROW_CONTEXT}
				decorators="small,bold"
			>
				<ColumnModifiers def={def} />
				{def.label ?? def.id}
			</CellEdit>
		);
	};

	const CellSearchView = ({
		colId,
		def,
	}: {
		colId: string;
		def: ColumnDef;
	}) => {
		const isToggle =
			def.searchOptions?.isFilter || def.searchOptions?.isSort;

		const Operator = () => {
			if (!def.searchOptions?.isFilter) return null;
			const name = `operators.${colId}`;
			return (
				<small style={{ display: 'flex' }}>
					<Select
						name={name}
						optionsMap={LogicalOperatorOptions}
						defaultValue={formData[name] ?? 'eq'}
					></Select>
				</small>
			);
		};

		return (
			<CellEditor
				key={colId}
				id={colId}
				colDef={!isToggle ? { ...def, readOnly: true } : def}
				status=""
				rowData={formData}
				rowContext={EMPTY_ROW_CONTEXT}
				Before={() => {
					if (!isToggle) return null;
					return <Operator />;
				}}
			/>
		);
	};

	const CellRowTools = () => {
		return (
			<Cell colSpan={ROW_SIDEBAR_COLS}>
				<button
					data-ezdg-action="$tableheader-apply-filters"
					title="$tableheader-apply-filters"
					onClick={(e) => {
						const row = asHtmlElement(
							e.currentTarget.closest('[data-ezdg-row]')
						);
						const fdata = collectFormRowData(row);
						// remove blank string values (implies no filtering)
						const sparams = unrollFlatMapKeys(
							Object.entries(fdata)
								.filter(([key, val]) => val !== '')
								.reduce((acc, cur) => {
									acc[cur[0]] = cur[1];
									return acc;
								}, {} as StructRecordAny)
						);

						_setState({
							searchParams: {
								...searchParams,
								...sparams,
								pagination: undefined,
							},
							formData: fdata,
						});

						tableContext.refetchPage(
							rollMapIntoFlatKeys(sparams) as SearchParams
						);
					}}
				>
					▶️
				</button>
			</Cell>
		);
	};

	return (
		<>
			<Row columns={totalColumns} isHeader={true}>
				<CellHeaderRowTools />
				{Object.values(normColsMap).map((col) => (
					<CellHeaderView def={col} key={col.id} />
				))}{' '}
			</Row>
			<Row
				columns={totalColumns}
				hide={!isExpanded}
				className={styles['toolbar-float']}
				rowIndex={'tableheader-toolbar'}
			>
				<CellRowTools />
				{Object.entries(normColsMap).map(([colId, def]) => (
					<CellSearchView colId={colId} def={def} key={colId} />
				))}
			</Row>
		</>
	);
};

export const TableFooterToolbar = (props: EZDataGridProps & { tableContext: EZDGTableContext; BulkEditAllBar?: (() => React.ReactNode) }) => {
	return <Row>
		<CellEdit colSpan={12} rowContext={EMPTY_ROW_CONTEXT}>
			<div data-ezdg-toolbar>{props.BulkEditAllBar?.()}
				<TableAddRowButton
					{...props}
				/></div>
		</CellEdit>
	</Row>;
};

export const EZDataGrid = ({
	hiddenValues = {},
	...props
}: EZDataGridProps<StructRecordAny>) => {
	const [tableState, setTableState] = useState({
		loadState: props.initialLoadState ?? 0,
		data: props.initialData ?? [],
		uiOverlays: {
			colMap: {},
		},
	} as StructEZDataGridState);

	const _setState = (state: Partial<typeof tableState>) => {
		setTableState((prev) => ({
			...prev,
			...state,
		}));
	};

	const normColumnDefs = getOverlayedColumnDefs(props.columnDefs, tableState);
	const colsMap: Record<string, (typeof normColumnDefs)[0]> = {};
	let tableColumns = 0;
	normColumnDefs.forEach((col) => {
		colsMap[col.id] = col;
		tableColumns += col.colSpan ?? 1;
	});

	const context: EZDGTableContext = {
		dataStore: props.dataStore,
		refetchPage: async (searchParams: SearchParams = {}) => {
			console.log('♻️ refetchPage', searchParams);
			props.dataStore
				.fetchPage(searchParams)
				.then(({ entities: data, pagination }) => {
					_setState({ loadState: 2, data, pagination });
				})
				.catch((error) => {
					_setState({ loadState: 3, error });
				})
				.finally(() => { });
		},
		paginate: async (params) => {
			// @todo
		},
		getColumnsWidth: (excludeEditBar?: boolean) =>
			tableColumns + (excludeEditBar ? 0 : ROW_SIDEBAR_COLS),
		getColumnDefs: () => ({ ...colsMap }),
		getHiddenValues: () => ({ ...hiddenValues }),
		addNewRow: (newRec) => {
			_setState({
				data: [...tableState.data, newRec],
			});
		},
		setUiOverlays: (p) => {
			console.log('setUiOverlays -> ', p);
			_setState({
				uiOverlays: {
					...tableState.uiOverlays,
					...p,
				},
			});
		},
		getUiOverlays: () => ({ ...tableState.uiOverlays }),
	};

	useEffect(() => {
		switch (tableState.loadState) {
			case 0:
				_setState({ loadState: 1 });
				break;
			case 1:
				context.refetchPage();
				break;
			default:
				break;
		}
	});

	const totalColumns = context.getColumnsWidth();

	const bulkEditor = useBulkEditor(props);

	return (
		<EZDGTableContextProvider.Provider value={context}>
			<div className={styles['ezdatagrid']}>
				<div data-ezdg-table>
					<TableHeaderToolbarRow
						colsMap={colsMap}
						totalColumns={totalColumns}
						tableContext={context}
					></TableHeaderToolbarRow>
					{Object.values(tableState.data).map((_row, index) => (
						<RowEditor
							{...props}
							key={_row._id ?? index}
							colsMap={colsMap}
							rowData={_row as StructRecordAny}
							columns={totalColumns}
							toggleBulkFn={bulkEditor.makeToggleFn(_row._id ?? index)}
						></RowEditor>
					))}
					<TableFooterToolbar
						{...props}
						tableContext={context}
						BulkEditAllBar={bulkEditor.BulkEditAllBar}
					/>
				</div>
			</div>
		</EZDGTableContextProvider.Provider>
	);
};
