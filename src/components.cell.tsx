import React from 'react';
import {
	CellEditorEditWrapper,
	CellEditorReadWrapper,
} from './components.formControls';
import {
	documentFocusOnCellByXY,
	htmlFindEditAddButtons,
	htmlFindSaveButtons,
	optionalHtmlButton,
} from './helpers';
import {
	CellBeforeAfterProps,
	CellEditorProps,
	ColumnDef,
	RowContext,
} from './types';

export const Cell = (
	{Before, After, ...props}: {
		className?: string;
	} & CellBeforeAfterProps &
		React.PropsWithChildren<Partial<ColumnDef>>
) => {
	return (
		<div data-ezdg-cell={props.colSpan ?? 1} className={props.className}>
			{Before && <Before />}{props.children}{After && <After />}
		</div>
	);
};

export const CellEdit = ({
	Before,
	After,
	...props
}: React.PropsWithChildren<
	Partial<ColumnDef> & {
		bold?: boolean;
		className?: string;
		decorators?: string;
		rowContext: RowContext;
	}
> &
	CellBeforeAfterProps) => {
	const colId = props.id ?? 'generic';
	const status = props.rowContext.getRowState().status;

	const handleOpenEdit = (e: React.KeyboardEvent | React.MouseEvent) => {
		if (status != 'view') return false;
		const rowIndex = props.rowContext.getRowIndex();
		props.rowContext.setStatus('edit');
		window.setTimeout(() => {
			documentFocusOnCellByXY({
				rowContext: props.rowContext,
				rowIndex,
				colIndex: colId,
			});
		}, 33);
		return true;
	};

	return (
		<div
			tabIndex={status == 'edit' ? undefined : 0}
			className={props.className}
			data-ezdg-cell={`${props.colSpan ?? 1}`}
			data-ezdg-colindex={`${colId}`}
			data-ezdg-decorators={props.decorators}
			onDoubleClick={(e) => {
				if (handleOpenEdit(e)) {
					e.preventDefault();
					e.stopPropagation();
				}
			}}
			onKeyDown={(e) => {
				/**
				 * KBbehavior (in-view): Enter: enable editing
				 */
				if (e.code == 'Enter' && handleOpenEdit(e)) {
					e.preventDefault();
					e.stopPropagation();
					return;
				} else if (props.rowContext.getRowState().status == 'view') {
					return;
				} else if (e.code != 'Enter') {
					return;
				} else if (props.type == 'text' && props.text?.isMultiline) {
					return;
				}

				const row = e.currentTarget.closest(
					'[data-ezdg-row]'
				) as HTMLDivElement;
				/**
				 * KBbehavior (in-edit): Enter, Shift+Enter
				 * - *: triggers update/create
				 * - Shift+: triggers edit of next row OR add new row
				 */
				htmlFindSaveButtons(row)?.forEach((btn, idx) => {
					if (idx == 0) {
						(btn as HTMLButtonElement).click();
						delete row.dataset['ezdgRowfocus'];
					}
				});

				if (e.shiftKey) {
					window.setTimeout(() => {
						htmlFindEditAddButtons(
							row?.nextElementSibling
						)?.forEach((e, idx) => {
							idx == 0 && optionalHtmlButton(e)?.click();
						});
					}, 33);
				}
			}}
		>
			{Before && <Before />}
			{props.children}
			{After && <After />}
		</div>
	);
};

export const CellEditor = (props: CellEditorProps) => {
	const errorMessage = props.validationError ? (
		<div data-ezdg-error data-ezdg-cell="spacer">
			{props.validationError}
		</div>
	) : null;
	const readOnly =
		props.status == 'view' ||
		props.colDef.readOnly ||
		(props.status == 'edit' && props.colDef.readOnlyOnUpdate);

	return (
		<CellEdit {...props.colDef} rowContext={props.rowContext}>
			{props.Before?.()}
			{readOnly && <CellEditorReadWrapper {...props} />}
			{!readOnly && <CellEditorEditWrapper {...props} />}
			{props.After?.()}
			{errorMessage}
		</CellEdit>
	);
};
