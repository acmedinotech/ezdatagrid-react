import React, { useEffect, useState } from 'react';
import {
	RowToolbarAdd,
	RowToolbarEdit,
	RowToolbarView,
} from './components.rowTools';
import { CellEditor } from './components.cell';
import { asHtmlElement, htmlFindEditAddButtons } from './helpers';
import {
	ROW_SIDEBAR_COLS,
	RowContext,
	RowEditorProps,
	StructRowState,
} from './types';

let rowCounter = 0;
// @todo extend props: columns, className, etc
export const Row = (
	props: {
		columns?: number;
		isHeader?: boolean;
		rowIndex?: number | string;
		flash?: string;
		hide?: boolean;
		rowFloats?: boolean;
		className?: string;
	} & React.PropsWithChildren
) => {
	const [idState] = useState(() => {
		const id = `row-${rowCounter++}`;
		return {
			id,
		};
	});

	// remove flash attribute within 1s of adding
	const volatileId = idState.id;
	useEffect(() => {
		if (props.flash) {
			window.setTimeout(() => {
				const ele = document.querySelector(`#${volatileId}`);
				if (ele) {
					delete (ele as HTMLElement).dataset.ezdgFlash;
				}
			}, 750);
		}
	});

	return (
		<div
			id={`row-${props.rowIndex}`}
			tabIndex={0}
			className={props.className}
			style={{
				display: props.hide ? 'none' : undefined,
				position: props.rowFloats ? 'absolute' : undefined,
			}}
			data-ezdg-row={props.columns ?? 20}
			data-ezdg-header={props.isHeader}
			data-ezdg-rowindex={props.rowIndex}
			data-ezdg-flash={props.flash}
			onFocus={(e) => {
				e.currentTarget.dataset['ezdgRowfocus'] = '1';
			}}
			onBlur={(e) => {
				delete e.currentTarget.dataset['ezdgRowfocus'];
			}}
			onDoubleClick={(e) => {
				htmlFindEditAddButtons(e.currentTarget)?.forEach((e) =>
					(e as HTMLButtonElement).click()
				);
			}}
			onKeyUp={(e) => {
				if (e.key == 'Escape') {
					const btn = e.currentTarget.querySelector(
						'button[data-ezdg-action="$cancel-edits"]'
					);
					if (btn) {
						(btn as HTMLButtonElement).click();
					}
				} else if (e.key == 'Enter') {
					htmlFindEditAddButtons(e.currentTarget)?.forEach((e) =>
						(e as HTMLButtonElement).click()
					);
				} else if (e.key == 'ArrowUp' && e.shiftKey) {
					asHtmlElement(
						e.currentTarget.previousElementSibling
					)?.focus();
				} else if (e.key == 'ArrowDown' && e.shiftKey) {
					asHtmlElement(e.currentTarget.nextElementSibling)?.focus();
				}
			}}
		>
			{props.children}
		</div>
	);
};

let _rowIndexCounter = 0;

export const RowEditor = (props: RowEditorProps) => {
	const { columns } = props;
	const [rowState, setRowState] = useState({
		status: props.status ?? 'view',
		isExpanded: false,
		data: props.rowData,
		errorMap: undefined,
	} as StructRowState);
	const myRowIndex = _rowIndexCounter++;
	const _setState = (
		state:
			| Partial<typeof rowState>
			| ((cstate: typeof rowState) => typeof rowState)
	) => {
		if (typeof state == 'function') {
			setRowState((prev) => state(prev));
		} else {
			setRowState((prev) => ({
				...prev,
				...state,
			}));
		}
	};

	const RowSpanAllCols = (
		props: { isError?: boolean } & React.PropsWithChildren
	) => {
		return (
			<div
				data-ezdg-row={columns}
				data-ezdg-error={props.isError}
				data-ezdg-flash={rowState.data['__flash']}
			>
				<div data-ezdg-cell={columns}>{props.children}</div>
			</div>
		);
	};

	const ExpandedRow = () => (
		<>
			{props.ExpandRowComponent && rowState.isExpanded && (
				<RowSpanAllCols>
					{props.ExpandRowComponent({
						rowData: rowState.data,
						rowContext: context,
						id: '$expanded-row-view',
					})}
				</RowSpanAllCols>
			)}
		</>
	);

	const ErrorRow = () => (
		<>
			{rowState.errorMap?.['*'] && (
				<RowSpanAllCols isError={true}>
					{rowState.errorMap['*']}
				</RowSpanAllCols>
			)}
		</>
	);

	const context: RowContext = {
		getRowIndex: () => rowState.data._id ?? myRowIndex,
		getRowState: () => ({ ...rowState }),
		getRowData: () => rowState.data,
		getCellValue: (colId, defaultValue) =>
			rowState.data[colId] ?? defaultValue,
		setCellValue: (colId, value) => {
			_setState({
				data: {
					...rowState.data,
					[colId]: value,
				},
			});
		},
		setDataFrom: (map) => {
			_setState((s) => {
				return { ...s, data: { ...s.data, ...map } };
			});
		},
		setStatus: (viewState) => {
			_setState({ status: viewState });
		},
		toggleExpanded: () => {
			_setState({ isExpanded: !rowState.isExpanded });
		},
		updateRowState: (state) => {
			_setState(state);
		},
	};

	const readOnly = props.readOnly ?? false;
	const isAdd = !readOnly && rowState.data.__flash == 'add';
	const isView = readOnly ||(!isAdd && rowState.status == 'view');
	const isEdit = !readOnly && rowState.status == 'edit';
	console.log({readOnly, flash: rowState.data.__flash, status: rowState.status, isAdd, isView, isEdit})

	return (
		<>
			<Row
				columns={columns}
				rowIndex={rowState.data._id ?? myRowIndex}
				flash={rowState.data.__flash}
			>
				<div data-ezdg-cell={ROW_SIDEBAR_COLS}>
					{isView && (
						<RowToolbarView {...props} rowContext={context} />
					)}
					{isAdd && <RowToolbarAdd {...props} rowContext={context} />}
					{isEdit && (
						<RowToolbarEdit {...props} rowContext={context} />
					)}
				</div>
				{Object.values(props.colsMap).map((col, index) => (
					<CellEditor
						rowContext={context}
						key={col.id}
						colDef={props.colsMap[col.id]}
						rowData={rowState.data}
						id={col.id}
						status={isAdd || isEdit ? 'edit' : 'view'}
						validationError={rowState.errorMap?.[col.id]}
					/>
				))}
			</Row>
			<ErrorRow />
			<ExpandedRow />
		</>
	);
};
