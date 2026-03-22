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

/**
 * 
 * @param param0 
 * @returns 
 */
export const Cell = (
	{ Before, After, decorators, ...props }: {
		className?: string;
		tabIndex?: number;
		decorators?: string;
		onClick?: (e: React.MouseEvent) => void;
		onDoubleClick?: (e: React.MouseEvent) => void;
		onKeyDown?: (e: React.KeyboardEvent) => void;
		onKeyUp?: (e: React.KeyboardEvent) => void;
		onMouseEnter?: (e: React.MouseEvent) => void;
		onMouseOver?: (e: React.MouseEvent) => void;
		onMouseLeave?: (e: React.MouseEvent) => void;
	} & CellBeforeAfterProps &
		React.PropsWithChildren<Partial<ColumnDef>>
) => {
	return (
		<div data-ezdg-cell={props.colSpan ?? 1}
			data-ezdg-colindex={props.id}
			data-ezdg-decorators={decorators}
			tabIndex={props.tabIndex}
			className={props.className}
			onClick={props.onClick}
			onDoubleClick={props.onDoubleClick}
			onKeyDown={props.onKeyDown}
			onKeyUp={props.onKeyUp}
			onMouseEnter={props.onMouseEnter}
			onMouseOver={props.onMouseOver}
			onMouseLeave={props.onMouseLeave}
			onFocus={(e) => {
				// let found = false;
				// e.currentTarget.querySelectorAll('input, textarea, select').forEach((input) => {
				// 	if (found) return;
				// 	if ((input as HTMLInputElement).type == 'hidden') return;
				// 	found = true;
				// 	(input as HTMLInputElement).focus();
				// 	console.log('focusing', input);
				// });
				// console.log('focus control found?', {found})
			}}
		>
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
		<Cell
			tabIndex={status == 'edit' ? undefined : 0}
			className={props.className}
			colSpan={props.colSpan}
			id={colId}
			decorators={props.decorators}
			onDoubleClick={(e) => {
				if (handleOpenEdit(e)) {
					e.preventDefault();
					e.stopPropagation();
				}
			}}
			onKeyDown={(e) => {
				const isQuickEnter = e.ctrlKey && e.key == 'Enter';
				/**
				 * KBbehavior (in-view): Enter: enable editing
				 */
				if (isQuickEnter && handleOpenEdit(e)) {
					e.preventDefault();
					e.stopPropagation();
					return;
				} else if (props.rowContext.getRowState().status == 'view') {
					return;
				} else if (!isQuickEnter) {
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
		</Cell>
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
