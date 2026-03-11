import React from 'react';
import {
	ColumnDef,
	EZDGError,
	StructRecordAny,
	StructKeyValue,
	RowContext,
} from './types';

export class EZDGMutateError extends EZDGError {
	constructor(errorMap: Record<string, string>) {
		super(errorMap, 'mutation');
	}
}

type UnrolledMap = Record<string, Record<string, any>>;

export const unrollFlatMapKeys = (input: Record<string, any>): UnrolledMap => {
	const unrolled: UnrolledMap = {};
	for (const [key, val] of Object.entries(input)) {
		const [prefix, ...rest] = key.split('.');
		const newKey = rest.join('.');

		// drop unprefixed keys
		if (newKey == '') continue;

		if (!unrolled[prefix]) {
			unrolled[prefix] = {};
		}
		unrolled[prefix][newKey] = val;
	}
	return unrolled;
};

export const rollMapIntoFlatKeys = (
	input: UnrolledMap
): Record<string, any> => {
	const map: Record<string, any> = {};
	for (const prefix in input) {
		const prefixVal = input[prefix];
		if (typeof prefixVal != 'object') continue;

		map[prefix] = {};
		for (const [key, val] of Object.entries(prefixVal)) {
			map[prefix][key] = val;
		}
	}
	return map;
};

export const normalizeOptionsToMap = (
	values: StructRecordAny | StructKeyValue[]
) => {
	let norm: StructRecordAny = {};
	if (values instanceof Array) {
		(values as StructKeyValue[]).forEach(({ key, value }) => {
			norm[key] = value;
		});
	} else {
		norm = { ...values };
	}
	return norm;
};

/**
 * NOTE: This only works with numeric enum values (no string -> string).
 *   Returns unique enums in the form `{enumValue: enumLabel}`.
 * @param values
 * @returns
 */
export const normalizeEnumToMap = (
	values: StructRecordAny | StructKeyValue[]
) => {
	let norm: StructRecordAny = {};
	Object.entries(values).forEach(([key, val]) => {
		if (typeof val == 'number') {
			norm[val] = key;
		}
	});

	return norm;
};

/**
 * Given an input, return the appropriate value based on `data-fdt-type` and `ele.value`.
 * Type override exists to allow parent handling of child (e.g. select -> option).
 */
export const extractInputValue = (
	ele: HTMLInputElement | HTMLSelectElement | HTMLOptionElement,
	overrideType?: string
): string | number | boolean | Date => {
	const ftType = overrideType ?? ele.dataset.fdtType;
	const val: string | number = ele.value;

	// console.log('extractInputValue', { val, typeOfVal: typeof(val), ftType })
	if (ftType == 'number') {
		return parseInt(val);
	} else if (ftType == 'boolean') {
		return val == '1' || val == 'true';
	} else if (ftType == 'date') {
		try {
			return new Date(Date.parse(val));
		} catch (error) {
			console.warn(`Failed to parse date value, returning`, {
				name: ele.tagName,
				val,
				error,
			});
		}
	}

	return val;
};

/**
 * Ensures both scalar & array conversion of input controls.
 *
 * - array if `input[type=checkbox][selected]`, otherwise scalar
 * - value type based on `data-fdt-type`
 * - `input[type='checkbox'][data-fdt-type='boolean']` operates as a scalar
 * */
export const addInputToData = (
	input: HTMLInputElement,
	data: StructRecordAny
) => {
	let val = extractInputValue(input);
	if (input.type != 'checkbox') {
		data[input.name] = val;
		return;
	}

	// console.log('addInputToData', { name: input.name, val, existing: data[input.name], type: input.type, checked: input.checked })

	const isTypeBool = input.dataset.fdtType == 'boolean';
	if (isTypeBool) {
		if (input.checked) {
			data[input.name] = true;
		} else {
			data[input.name] = false;
		}
		return;
	} else if (!input.checked) {
		return;
	}

	if (data[input.name] == undefined) {
		// possibly single checkbox with basic on/off
		data[input.name] = [val];
	} else if (!(data[input.name] instanceof Array)) {
		// existing value (from previous checkbox) -- convert to array and preserve existing value
		data[input.name] = [data[input.name], val];
	} else {
		// existing list -- push to existing
		data[input.name].push(val);
	}
};

/**
 * Ensures both scalar & array conversion of select control.
 *
 * - scalar or array based on `select.multiple`
 * - value type based on `data-fdt-type`
 * */
export const addSelectToData = (
	select: HTMLSelectElement,
	data: StructRecordAny
) => {
	if (!select.multiple) {
		data[select.name] = extractInputValue(select);
		return;
	}

	for (const option of select.options) {
		if (option.selected) {
			// @todo override existing valye if not array?
			if (!data[select.name]) {
				data[select.name] = [];
			}
			data[select.name].push(
				extractInputValue(option, option.dataset.ftType)
			);
		}
	}
};

/**
 * Given a parent element (e.g. `EZDGRow`), convert all valid form controls
 * (input, select, textarea) to a map of values representing row data.
 *
 * Note that `FleDataTable` behavior makes it so that editing the parent row
 * will force any open children views into view mode, eliminating chance of
 * nested EZDG form data.
 */
export const collectFormRowData = (ele: HTMLElement): StructRecordAny => {
	const data: StructRecordAny = {};

	ele.querySelectorAll('input, select, textarea').forEach((input) => {
		if (input instanceof HTMLInputElement) {
			addInputToData(input, data);
		} else if (input instanceof HTMLSelectElement) {
			addSelectToData(input, data);
		} else if (input instanceof HTMLTextAreaElement) {
			data[input.name] = input.value;
		}
	});

	return data;
};

export const parseDateFromValue = (
	dateValue?: string | number | Date | React.ReactNode
): Date | undefined => {
	let date: Date | undefined = undefined;
	if (dateValue instanceof Date) {
		date = dateValue;
	} else if (typeof dateValue == 'string') {
		try {
			date = new Date(dateValue);
		} catch (e) {
			return undefined;
		}
	} else if (typeof dateValue == 'number') {
		date = new Date(dateValue);
	}

	if (isNaN(date?.getTime() ?? NaN)) {
		return undefined;
	}

	return date;
};

export const getFriendlyISODate = (date: Date, length = 19) =>
	date.toISOString().substring(0, length).split('T').join(' ');

export const normalizeAndValidateRowData = (
	data: StructRecordAny,
	columnDefs: ColumnDef[]
) => {
	const normData = { ...data };
	const errMap: Record<string, string> = {};

	columnDefs.forEach((colDef) => {
		const { id, normalizeValue, validateOrReturnError } = colDef;
		const normVal = normalizeValue?.(data[id]) ?? data[id];
		normData[id] = normVal;

		const err = validateOrReturnError?.(normVal, colDef);
		if (err) {
			errMap[id] = err;
		}
	});

	return {
		data: normData,
		errorMap: errMap,
		hasErrors: Object.values(errMap).length > 0,
	};
};

// attempts to focus on data-ezdg-focusfirst
export const documentFindPriorityFocus = (parent?: Element | null) =>
	parent?.querySelector('[data-ezdg-focusfirst]') ?? null;

export const documentFocusOnFirstControl = (parent?: Element | null) =>
	parent
		?.querySelectorAll('select, textarea, input, [data-ezdg-control]')
		.forEach((e, idx) => {
			// @todo move focus to start of element
			idx == 0 && (e as HTMLElement).focus();
		});

export const documentFocusOnCellByXY = ({
	rowContext,
	rowIndex,
	colIndex,
}: {
	rowContext: RowContext;
	rowIndex: string | number | undefined;
	colIndex: string | number;
}) => {
	const rowSelector = rowIndex ? `[data-ezdg-rowindex="${rowIndex}"]` : '';
	const parent = document.querySelector(rowSelector);
	documentFocusOnFirstControl(
		parent?.querySelector(`[data-ezdg-colindex="${colIndex}"]`)
	);
};

export const documentFocusOnLastAddNewRow = ({
	table,
}: {
	table: HTMLElement | null;
}) => {
	let lastRow: Element | null = null;
	table
		?.querySelectorAll('[data-ezdg-flash="add"]')
		.forEach((e) => (lastRow = e));
	documentFocusOnFirstControl(documentFindPriorityFocus(lastRow) ?? lastRow);
};

export const htmlFindSaveButtons = (parent?: Element | null) =>
	parent?.querySelectorAll(
		'[data-ezdg-action="$update-row"], [data-ezdg-action="$create-row"]'
	);

export const htmlFindEditAddButtons = (parent?: Element | null) =>
	parent?.querySelectorAll(
		'[data-ezdg-action="$edit-row"], [data-ezdg-action="$table_add-row"]'
	);

/**
 * DANGEROUS. Use it when you know you're dealing with a concrete
 * object and want an easy cast.
 */
export const asHtmlElement = (ele?: Element | null) => ele as HTMLElement;

export const optionalHtmlButton = (ele?: Element | null) =>
	ele ? (ele as HTMLButtonElement) : null;

export const LogicalOperatorOptions = {
	lt: '<',
	lte: '<=',
	eq: '=',
	neq: '!=',
	gte: '>=',
	gt: '>',
	regex: 'rgx',
};

export const SortOptions = {
	'': '----',
	asc: 'asc',
	dsc: 'desc',
};
