import React, { FunctionComponent, useState } from 'react';
import {
	getFriendlyISODate,
	normalizeOptionsToMap,
	parseDateFromValue,
} from './helpers';
import {
	CellEditorProps,
	CellViewProxyComponent,
	ColumnDef,
	StructKeyValue,
} from './types';

export const Select = ({
	optionsMap: optionsList,
	...props
}: {
	optionsMap: Record<string, any>;
} & React.SelectHTMLAttributes<HTMLSelectElement>) => {
	return (
		<select {...props}>
			{Object.entries(optionsList).map(([key, label]) => {
				return (
					<option value={key} key={key}>
						{label}
					</option>
				);
			})}
		</select>
	);
};

export const DateInputView = (
	props: ColumnDef & { value?: string | number | Date | React.ReactNode }
) => {
	const date = parseDateFromValue(props.value) ?? props.defaultValue?.();
	return (
		<input
			data-ezdg-type="date"
			name={props.id}
			defaultValue={
				date
					? getFriendlyISODate(date, props.date?.isoLength)
					: props.value !== undefined
					? String(props.value)
					: ''
			}
		/>
	);
};

export const DateView = (
	props: ColumnDef & {
		value?: string | number | Date | React.ReactNode;
	}
) => {
	const date = parseDateFromValue(props.value);
	if (!date) {
		return <span data-ezdg-error>{String(props.value)}</span>;
	}

	return <span>{getFriendlyISODate(date, props.date?.isoLength)}</span>;
};

export const CellOptionsListInput = ({
	initialValues,
	colDef: { id, optionsList: options = { values: [] }, isArray, focusFirst },
}: { colDef: ColumnDef } & { initialValues: any }) => {
	const { type, values } = options;
	const normValsMap = normalizeOptionsToMap(values);
	const normType = type == 'checkbox' && !isArray ? 'radio' : type;

	switch (normType) {
		case 'radio':
			return (
				<div data-ezdg-cell-optionslist>
					{Object.entries(normValsMap).map(([key, label]) => {
						return (
							<div key={key}>
								<input
									name={id}
									type="radio"
									value={key}
									title={label}
									defaultChecked={initialValues == key}
								/>{' '}
								{label}
							</div>
						);
					})}
				</div>
			);
		case 'checkbox':
			return (
				<div data-ezdg-cell-optionslist>
					{Object.entries(normValsMap).map(([key, label]) => {
						return (
							<div key={key}>
								<input
									name={id}
									type="checkbox"
									value={key}
									multiple={isArray}
									title={label}
								/>{' '}
								{label}
							</div>
						);
					})}
				</div>
			);
		default:
			return (
				<Select
					optionsMap={normValsMap}
					name={id}
					multiple={isArray}
					defaultValue={initialValues}
					data-ezdg-cell-optionslist
					data-ezdg-focusfirst={focusFirst}
				></Select>
			);
	}
};

export const CellInputWrapper = ({
	value,
	colDef,
}: {
	value: any;
	colDef: ColumnDef;
}) => {
	if (colDef.optionsList) {
		return (
			<CellOptionsListInput
				colDef={colDef}
				initialValues={value}
			></CellOptionsListInput>
		);
	}

	const defaultValue = value;

	switch (colDef.type) {
		// @todo isArray=true
		case 'number':
		case 'boolean':
			return (
				<input
					data-ezdg-type={colDef.type}
					name={colDef.id}
					defaultValue={defaultValue as number}
				/>
			);
		case 'date':
			return <DateInputView {...colDef} value={defaultValue} />;
		default:
			return colDef.text?.isMultiline ? (
				<textarea name={colDef.id}>{defaultValue}</textarea>
			) : (
				<input
					type="text"
					name={colDef.id}
					defaultValue={defaultValue as string}
				/>
			);
	}
};

// @on-hold
export const ArrayOfInputs = ({
	values = [],
	ViewDelegate,
	onChange,
}: {
	values?: any[];
	ViewDelegate: (value: any, index: number) => React.ReactNode;
	onChange?: (values: any[]) => void;
}) => {
	const [state, setState] = useState({
		values: [...values],
	});
	return (
		<div data-ezdg-table>
			{state.values.map((val, index) => {
				return (
					<div data-ezdg-row="10" key={index}>
						<div data-ezdg-cell="8">{ViewDelegate(val, index)}</div>
						<div data-ezdg-cell="2">
							<button
								title="remove item"
								onClick={() => {
									setState((s) => {
										const newState = {
											values: s.values.filter(
												(v, idx) => idx !== index
											),
										};
										onChange?.(newState.values);
										return newState;
									});
								}}
							>
								-
							</button>
						</div>
					</div>
				);
			})}
			<div data-ezdg-row="10">
				<div data-ezdg-cell="10">
					<button
						title="add item"
						onClick={() => {
							setState((s) => {
								const newState = {
									values: [...state.values, Date.now()],
								};
								return newState;
							});
						}}
					>
						+
					</button>
				</div>
			</div>
		</div>
	);
};

export const CellReadWrapper = ({
	rowData,
	rowContext,
	colDef,
}: CellEditorProps) => {
	const ViewComponent = colDef.CellReadView ?? colDef.CellView;
	if (ViewComponent) {
		return ViewComponent({ rowData, rowContext, id: colDef.id });
	}

	const value = rowData[colDef.id];
	let normVal = value;
	if (colDef.optionsList) {
		normVal = colDef.optionsList.values[value ?? ''] ?? normVal;
	}

	switch (colDef.type) {
		case 'date':
			return <DateView value={normVal} {...colDef} />;
		case 'boolean': // @todo complete
		case 'number': // @todo complete
		default:
			return <span>{normVal}</span>;
	}
};

export const CellEditorReadWrapper = (props: CellEditorProps) => {
	if (props.colDef.CellView) {
		return props.colDef.CellView(props);
	}

	const defaultValue =
		props.rowData[props.id] ?? props.colDef.defaultValue?.();
	if (props.colDef.isArray) {
		let arr: any[] = [];
		if (defaultValue! instanceof Array) {
			arr.push(defaultValue);
		} else {
			arr.push(...defaultValue);
		}
		return (
			<div data-ezdg-viewlist>
				{arr.map((val, idx) => (
					<CellReadWrapper {...props} key={idx} />
				))}
			</div>
		);
	} else {
		return <CellReadWrapper {...props} />;
	}
};

export const wrapInFocusFirst = (
	component: React.ReactNode,
	isFocusFirst?: boolean
): React.ReactNode => (
	<div data-ezdg-focusfirst={isFocusFirst}>{component}</div>
);

export const CellEditorEditWrapper = (props: CellEditorProps) => {
	if (props.colDef.CellEditView) {
		return wrapInFocusFirst(
			props.colDef.CellEditView(props),
			props.colDef.focusFirst
		);
	} else if (props.colDef.CellView) {
		return wrapInFocusFirst(
			props.colDef.CellView(props),
			props.colDef.focusFirst
		);
	}

	const defaultValue =
		props.rowData[props.id] ?? props.colDef.defaultValue?.();
	return wrapInFocusFirst(
		<CellInputWrapper value={defaultValue} colDef={props.colDef} />,
		props.colDef.focusFirst
	);
};

export const URLCellView: CellViewProxyComponent = ({
	rowContext: ctx,
	rowData: data,
	id,
}) => {
	const value = data[id];
	let url: URL | undefined;
	try {
		url = new URL(value);
	} catch (e) {
		return <span>{value}</span>;
	}

	let pathParts = url.pathname.split('/');
	if (!pathParts[pathParts.length - 1]) {
		pathParts.pop();
	}

	let urlFragments: string[] = [];
	urlFragments.push(`↗️${url.hostname}`);
	if (url.port) {
		urlFragments[0] += ':' + url.port;
	}
	urlFragments.push(...pathParts);

	if (urlFragments.length > 5) {
		const [_one, ...rest] = urlFragments;
		const n = rest.pop() as string,
			n_1 = rest.pop() as string,
			n_2 = rest.pop() as string;
		urlFragments = [_one, '...', n_2, n_1, n];
	}

	const qsParts = url.search
		.split('&')
		.filter((kv) => !kv.match(/^(utm|ref)/));
	if (qsParts.length > 0) {
		let qsJoin = qsParts.join('&');
		if (qsJoin.length > 61) {
			qsJoin = '?...' + qsJoin.substring(qsJoin.length - 61);
		}
		urlFragments.push(qsJoin);
	}

	return (
		<a href={value} target={value}>
			<small data-ezdg-flex="wrap,gap">
				{urlFragments.map((f, idx) => (
					<span key={idx}>{f}</span>
				))}
			</small>
		</a>
	);
};
