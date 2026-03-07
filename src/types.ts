/**
 * Well-defined `any` expects key-value map to represent row data.
 */
export type StructRecordAny = Record<string, any>;
export type StructKeyValue = { key: string; value: any };

export type AllowedColumnDefTypes = 'text' | 'number' | 'date' | 'boolean';

/**
 * Canonical list of recognized data-* attributes.
 */
export enum DataKeys {
	'error' = 'data-ezdg-error',
	'table' = 'data-ezdg-table',
	'row' = 'data-ezdg-row',
	'cell' = 'data-ezdg-cell',
	'cellOptionsList' = 'data-ezdg-cell-optionslist',
}

export type CellViewProxyProps = {
	id: number | string;
	rowData: StructRecordAny;
	rowContext: RowContext;
};

export type CellViewProxyComponent = (
	props: CellViewProxyProps
) => React.ReactNode;

export type ColumnDef = {
	/**
	 * The key in the fetched entity that this column maps to.
	 */
	id: string;
	/**
	 * The column header; if undefined, `id` will be used.
	 */
	label?: string;
	/**
	 * Merged into <Cell className/>.
	 */
	cellClassName?: string;
	/**
	 * Column type. Helps to decode HTML attribute values when row
	 *   data is serialized &&
	 *   Defines a default view when [read, edit] custom views are not defined.
	 */
	type?: AllowedColumnDefTypes;
	focusFirst?: boolean;
	searchOptions?: {
		isFilter?: boolean;
		isSort?: boolean;
	};
	/**
	 * Display options for `type=text`.
	 */
	text?: {
		isMultiline?: boolean;
	};
	date?: {
		isoLength?: number;
	};
	/**
	 * Indicates that this column can store multiple values.
	 */
	isArray?: boolean;
	/**
	 * Control type when column is restricted to a set of options.
	 */
	optionsList?: {
		type?: 'dropdown' | 'checkbox' | 'radio';
		values: StructRecordAny;
	};
	/**
	 * Number of columns to occupy in UI grid.
	 */
	colSpan?: number;
	/**
	 * If true, this column can never be updated via interface
	 *   (e.g. auto-generated id).
	 */
	readOnly?: boolean;
	/**
	 * If true, this column is editable only when adding a new record
	 *   (e.g. a field that allows for user-generated unique key value).
	 */
	readOnlyOnUpdate?: boolean;
	/**
	 * Custom default cell view. Will be fallback when no other
	 *   custom views match the mode.
	 */
	CellView?: CellViewProxyComponent;
	/**
	 * Custom read-only cell view. Overrides `CellView`.
	 */
	CellReadView?: CellViewProxyComponent;
	/**
	 * Custom edit cell view. Overrides `CellView`.
	 */
	CellEditView?: CellViewProxyComponent;
	/**
	 * Generates an initial value if local-state == undefined;
	 *   Otherwise, `undefined` will be the default.
	 */
	defaultValue?: () => any;
	/**
	 * Applies a transformation to the editor's value
	 *   before overwriting local-state.
	 */
	normalizeValue?: (value: any) => any;
	/**
	 * If validation function returns a string,
	 *   Signals that this value is bad.
	 */
	validateOrReturnError?: (
		value: any,
		colDef: ColumnDef
	) => undefined | string;
	/**
	 * If validation fails &&
	 *  If $self true, the bad value overwrites local-state;
	 *  Else, the old value remains
	 */
	preserveValueOnError?: boolean;
};

// @deprecate?
export type StructEntityReactNode = Record<string, React.ReactNode>;

export type PaginationParams = {
	offset?: number;
	limit?: number;
	previousCursor?: string;
	nextCursor?: string;
	currentPage?: number;
	totalRecords?: number;
	totalPages?: number;
	pageSize?: number;
};

export type FilterField = { column: string; op?: string; value: any };
export type SortField = { column: string; isAsc?: boolean };

/**
 * - `WHERE #key $operators[#key] $filters[#key] ...`
 * - `ORDER BY #key $sorts[#key] ...`
 * - `[OFFSET $pagination.offset, $pagination.pageSize] [LIMIT $pagination.limit]`
 */
export type SearchParams = {
	filters?: Record<string, any>;
	operators?: Record<string, any>;
	sorts?: Record<string, any>;
	pagination?: PaginationParams;
};

/**
 *
 */
export type StructFetchPage<Entity = StructRecordAny> = {
	entities: Entity[];
	pagination?: PaginationParams;
};

export const isStructFetchPage = (obj: any): obj is StructFetchPage =>
	obj?.entities instanceof Array;

export type StructError = {
	error: {
		errorMap: Record<string, string>;
		_model: string;
	};
};

export const isStructError = (obj: any): obj is StructError => obj?.error;

export class EZDGError extends Error {
	errorMap: StructError['error']['errorMap'];
	constructor(
		errorMap: StructError['error']['errorMap'],
		message = 'generic'
	) {
		super(JSON.stringify({ message: `EZDGError:${message}`, errorMap }));
		this.errorMap = { ...errorMap };
	}
}

export type DataStore<Entity = StructRecordAny> = {
	fetchPage: (pagination?: SearchParams) => Promise<StructFetchPage>;
	fetchRow?: (id: any) => Promise<Entity>;
	updateRow?: (rowData: Entity) => Promise<Entity>;
	createRow?: (rowData: Entity) => Promise<Entity>;
	deleteRow?: (rowData: Entity) => Promise<Entity>;
};

export type StructRowState = {
	status: 'view' | 'edit' | 'add';
	isExpanded: boolean;
	data: StructRecordAny;
	errorMap?: StructError['error']['errorMap'];
};

export type RowContext = {
	getRowIndex: () => number;
	getRowState: () => StructRowState;
	getRowData: () => StructRecordAny;
	getCellValue: <T = unknown>(colId: string, defaultValue?: T) => T;
	setCellValue: (colId: string, value: any) => void;
	setDataFrom: (map: StructRecordAny) => void;
	setStatus: (status: StructRowState['status']) => void;
	toggleExpanded: () => void;
	updateRowState: (state: Partial<StructRecordAny>) => void;
};

export const EMPTY_FN = () => {};
export const EMPTY_ROW_CONTEXT = {
	getRowIndex: () => -1,
	getRowState: () => ({}),
	getColValue: EMPTY_FN,
	getRowData: EMPTY_FN,
	setColValue: EMPTY_FN,
	setColValuesFrom: EMPTY_FN,
	setViewState: EMPTY_FN,
} as unknown as RowContext;

export type CellBeforeAfterProps = {
	Before?: () => React.ReactNode;
	After?: () => React.ReactNode;
};

export type CellEditorProps = {
	colDef: ColumnDef;
	id: string | number;
	rowData: StructRecordAny;
	status: string;
	validationError?: string;
	rowContext: RowContext;
} & CellBeforeAfterProps;

export type RowEditorProps = {
	columns: number;
	colsMap: Record<string, ColumnDef>;
	rowData: StructRecordAny;
	status?: string;
} & EZDataGridProps<StructRecordAny>;

export enum LoadState {
	notInitialized,
	loadingData,
	loadComplete,
	error,
}

export type StructEZDataGridState = {
	loadState: LoadState;
	data: StructRecordAny[];
	searchParams?: SearchParams;
	pagination?: PaginationParams;
	error?: Error;
	uiOverlays: {
		colMap: Record<string, ColumnDef>;
	};
};

export type EZDGTableContext = {
	dataStore: DataStore;
	refetchPage: (searchParams?: SearchParams) => Promise<void>;
	paginate: (params: PaginationParams) => Promise<void>;
	/**
	 * Returns total column span of all `ColumnDef` + span of row edit bar
	 * (unless excluded)
	 */
	getColumnsWidth: (excludeEditBar?: boolean) => number;
	getColumnDefs: () => Record<string, ColumnDef>;
	getHiddenValues: () => StructRecordAny;
	addNewRow: (record: StructRecordAny) => void;
	getUiOverlays: () => StructEZDataGridState['uiOverlays'];
	setUiOverlays: (
		partial: Partial<StructEZDataGridState['uiOverlays']>
	) => void;
	// @todo make copy-paste helpers
};

export type EZDataGridProps<Entity = StructRecordAny> = {
	columnDefs: ColumnDef[];
	/**
	 * Optional key-values that define the scope of a table.
	 *   E.g. if displaying a Person record that has a list of Addresses
	 *   that is represented as a sub-table (and stored separately),
	 *   the Address sub-table can receive the parent (Person)'s
	 *   identifying info so that it can always be associated to the parent.
	 */
	hiddenValues?: StructRecordAny;
	/**
	 * Static data to initialize table with. Helpful in slow-loading
	 *   situations. Also helpful if you want a 'static' table.
	 */
	initialData?: Entity[];
	/**
	 * {@see LoadState}
	 * @todo formalize mapping enum to dropdown
	 */
	initialLoadState?: number;
	viewFlags?: {
		hideHeaderTools?: boolean;
		hideCellTools?: boolean;
		hideFooterTools?: boolean;
		hideEdit?: boolean;
		hideDebug?: boolean;
		hideAdd?: boolean;
	};
	readOnly?: boolean;
	dataStore: DataStore;
	ExpandRowComponent?: (props: CellViewProxyProps) => React.ReactNode;
};

export const ROW_SIDEBAR_COLS = 1;
