import {
	CellEditorProps,
	EZDataGridProps,
	EZDGTableContext,
	RowEditorProps,
	StructRecordAny,
} from './types';
import {
	collectFormRowData,
	documentFocusOnLastAddNewRow,
	EZDGMutateError,
	normalizeAndValidateRowData,
} from './helpers';
import { useContext, useState } from 'react';
import { EZDGTableContextProvider } from './components';

type RowButtonProps = {
	buttonLabel?: string;
} & Pick<CellEditorProps, 'rowContext' | 'rowData'> &
	Pick<RowEditorProps, 'ExpandRowComponent'>;

type RowToolbarProps = RowButtonProps & RowEditorProps;

export const RowExpandButton = ({
	ExpandRowComponent,
	rowContext,
}: RowButtonProps) => {
	if (!ExpandRowComponent) {
		return null;
	} else {
		const isExpanded = rowContext.getRowState().isExpanded;
		return (
			<button
				title={isExpanded ? '$view-less' : '$view-more'}
				onClick={() => rowContext.toggleExpanded()}
			>
				{isExpanded ? '🔼' : '🔽'}
			</button>
		);
	}
};

export const RowDebugButton = ({ rowContext }: RowButtonProps) => {
	const { data, ...rowState } = rowContext.getRowState();
	return (
		<button
			data-ezdg-action="$debug-record"
			onClick={() =>
				console.log('EZDGDataRow.debug', {
					myRowCounter: rowContext.getRowIndex(),
					rowState,
					data,
				})
			}
		>
			🐞
		</button>
	);
};

export const RowExpandedView = ({
	ExpandRowComponent,
	rowContext,
	...props
}: RowButtonProps) => {
	const rowState = rowContext.getRowState();
	if (ExpandRowComponent && rowState.isExpanded) {
		return (
			<>
				<div data-ezdg-cell="20">
					<ExpandRowComponent
						{...props}
						rowContext={rowContext}
						id="$expanded-row"
					/>
				</div>
			</>
		);
	}
	return null;
};

export const RowToolbarView = (props: RowButtonProps & RowEditorProps) => {
	const readOnly = props.readOnly ?? false;
	return (
		<div data-ezdg-toolbar="inline">
			<span><input type="checkbox" name="$bulkedit_select-row" value={props.rowContext.getRowIndex()} onChange={(e) => props.toggleBulkFn?.(e.target.checked)} /></span>

			<RowExpandButton {...props} />
			<RowDebugButton {...props} />
		</div>
	);
};

export const TableAddRowButton = ({
	tableContext,
	...props
}: EZDataGridProps & { tableContext: EZDGTableContext }) => {
	return (
		<button
			data-ezdg-action="$table_add-row"
			disabled={props.readOnly}
			onClick={(e) => {
				const table = e.currentTarget.closest('[data-ezdg-table');
				// @todo need newRec generator
				// @todo row-id generation
				tableContext.addNewRow({
					id: `*${Date.now()}`,
					...props.hiddenValues,
					__flash: 'add',
				});
				window.setTimeout(() => {
					documentFocusOnLastAddNewRow({
						table: table as HTMLElement,
					});
				}, 33);
			}}
		>
			add
		</button>
	);
};

export const RowCreateButton = ({ rowContext }: RowButtonProps) => {
	const tableCtx = useContext(EZDGTableContextProvider);
	return (
		<button
			data-ezdg-action="$create-row"
			title="$create-row"
			onClick={(e) => {
				const t = e.currentTarget;
				t.disabled = true;
				const table = t.closest('[data-ezdg-table]');
				const rowData = collectFormRowData(
					t.closest(`[data-ezdg-row]`) as HTMLElement
				);

				const mergedData = { ...rowContext.getRowData(), ...rowData };
				delete mergedData.__flash;
				const {
					data: normData,
					errorMap,
					hasErrors,
				} = normalizeAndValidateRowData(
					mergedData,
					Object.values(tableCtx.getColumnDefs())
				);
				if (hasErrors) {
					rowContext.updateRowState({ errorMap });
					return;
				}

				tableCtx.dataStore
					.createRow?.(normData as StructRecordAny)
					.then((savedData) => {
						rowContext.updateRowState({
							status: 'view',
							data: { ...savedData, __flash: 'created' },
							errorMap: undefined,
						});
					})
					.catch((error: EZDGMutateError) => {
						t.disabled = false;
						rowContext.updateRowState({ errorMap: error.errorMap });
					})
					.finally(() => {
						t.disabled = false;
					});
			}}
		>
			➕
		</button>
	);
};

export const RowToolbarAdd = ({
	rowContext,
	columnDefs,
	...props
}: RowToolbarProps) => {
	return (
		<div data-ezdg-toolbar="inline">
			<RowCreateButton {...props} rowContext={rowContext} />
			<RowDebugButton {...props} rowContext={rowContext} />
		</div>
	);
};

export const RowUpdateButton = ({
	rowContext,
	buttonLabel = '💾',
}: RowButtonProps) => {
	const tableCtx = useContext(EZDGTableContextProvider);
	const [bstate, setBstate] = useState({
		curLabel: buttonLabel,
	});
	const resetInnerTextAfter = (fn: () => void) => {
		window.setTimeout(fn, 2000);
	};
	return (
		<button
			data-ezdg-action="$update-row"
			title="$update-row"
			onClick={(e) => {
				const t = e.currentTarget;
				t.disabled = true;
				t.innerText = '🟡';
				const rowData = collectFormRowData(
					t.closest(`[data-ezdg-row]`) as HTMLElement
				);

				const mergedData = { ...rowContext.getRowData(), ...rowData };
				delete mergedData.__flash;
				const {
					data: normData,
					errorMap,
					hasErrors,
				} = normalizeAndValidateRowData(
					mergedData,
					Object.values(tableCtx.getColumnDefs())
				);
				if (hasErrors) {
					t.innerText = '🔴';
					resetInnerTextAfter(() => {
						t.innerText = buttonLabel;
						t.disabled = false;
					});
					rowContext.setDataFrom({ errorMap });
					return;
				}

				tableCtx.dataStore
					.updateRow?.(normData)
					.then((savedData) => {
						t.innerText = '🟢';
						rowContext.updateRowState({
							status: 'view',
							data: { ...savedData, __flash: 'modified' },
							errorMap: undefined,
						});
					})
					.catch((error: EZDGMutateError) => {
						t.innerText = '🔴';
						rowContext.updateRowState({ errorMap: error.errorMap });
					})
					.finally(() => {
						resetInnerTextAfter(() => {
							t.innerText = buttonLabel;
							t.disabled = false;
						});
					});
			}}
		>
			{bstate.curLabel}
		</button>
	);
};

export const RowCancelButton = ({ rowContext }: RowButtonProps) => {
	return (
		<button
			data-ezdg-action="$cancel-edits"
			title="$cancel-edits"
			onClick={(e) => {
				rowContext.updateRowState({
					status: 'view',
					errorMap: undefined,
				});
			}}
		>
			❌
		</button>
	);
};

export const RowToolbarEdit = ({
	rowContext,
	columnDefs,
	...props
}: RowButtonProps & RowEditorProps) => {
	const tableCtx = useContext(EZDGTableContextProvider);
	return (
		<div data-ezdg-toolbar="inline">			
			<RowUpdateButton {...props} rowContext={rowContext} />
			<RowCancelButton {...props} rowContext={rowContext} />
			<RowDebugButton {...props} rowContext={rowContext} />
			{/* @todo show indicator when row is saving? 🟡 -> 🔴|🟢 -> ⚪️  */}
		</div>
	);
};
