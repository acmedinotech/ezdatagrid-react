import React from 'react';
import {
	CellEditorEditWrapper,
	CellEditorReadWrapper,
} from './components.formControls';
import {
	documentFocusOnCellByXY,
	documentFindEditAddButtons,
	documentFindSaveButtons,
	optionalHtmlButton,
	documentFocusOnFirstControl,
	normalizeKeyUp,
} from './helpers';
import * as kbEvents from './utils.kbEvents';
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
	Partial<ColumnDef> & CellEditorProps>) => {
	const colId = props.id ?? 'generic';
	const status = props.status ?? props.rowContext.getRowState().status;

	const refocusCell = (parent: HTMLElement | null) => {
		// console.log('refocusCell ###', `[data-ezdg-colindex="${colId}"]`, parent, parent?.querySelector(`[data-ezdg-colindex="${colId}"]`)?.focus);
		parent?.querySelector(`[data-ezdg-colindex="${colId}"]`)?.focus();
	}

	const handleViewOpenEdit = (e: React.KeyboardEvent | React.MouseEvent) => {
		// console.log('handleViewOpenEdit', { status }, e);
		if (status != 'view') return false;
		const rowIndex = props.rowContext.getRowIndex();
		props.rowContext.setStatus('edit');
		const row = e.currentTarget.closest('[data-ezdg-row]') as HTMLDivElement;
		window.setTimeout(() => {
			// documentFocusOnCellByXY({
			// 	rowContext: props.rowContext,
			// 	rowIndex,
			// 	colIndex: colId,
			// });
			documentFocusOnFirstControl(row?.querySelector(`[data-ezdg-colindex="${colId}"]`));
		}, 33);
		return true;
	};

	const getKeyUpArgs = (row: HTMLDivElement): kbEvents.HandleCellKeyUpArgs => {
		return {
			handleViewOpenEdit,
			handleQuickEnter: () => {
				/**
				 * KBbehavior (in-edit):
				 * - Ctrl+Enter: save edits
				 * - Ctrl+Shift+Enter: triggers edit of next row OR add new row
				 */
				documentFindSaveButtons(row)?.forEach((btn, idx) => {
					// console.log('save button', btn, idx);
					if (idx == 0) {
						(btn as HTMLButtonElement).click();
						delete row.dataset['ezdgRowfocus'];
					}
				});
			},
			handleQuickShiftEnter: () => {
				window.setTimeout(() => {
					documentFindEditAddButtons(
						row?.nextElementSibling
					)?.forEach((e, idx) => {
						if (idx == 0) {
							optionalHtmlButton(e)?.click();
							// step 2: after brief delay, attempt to focus on corresponding cell+first control
							window.setTimeout(() => {
								documentFocusOnFirstControl(row?.nextElementSibling?.querySelector(`[data-ezdg-colindex="${colId}"]`));
							}, 33);
						}
					});
				}, 33);
			},
			handleEnter: () => {
				window.setTimeout(() => {
					refocusCell(row);
				}, 66);
			},
			handleEscape: () => {
				const btn = row.querySelector(
					'button[data-ezdg-action="$cancel-edits"]'
				);
				(btn as HTMLButtonElement)?.click();
				window.setTimeout(() => {
					refocusCell(row);
				}, 66);
			},
			handleArrow: (arrow) => {
				let focusTarget = null as HTMLElement | ChildNode | null;
				if (arrow.dir == 'left' || arrow.dir == 'right') {
					if (arrow.dir == 'left') {
						focusTarget = e.currentTarget.previousSibling;
					} else {
						focusTarget = e.currentTarget.nextSibling;
					}
					focusTarget?.focus();
				} else {
					if (arrow.dir == 'up') {
						focusTarget = row.previousSibling;
					} else {
						focusTarget = row.nextSibling;
					}
					refocusCell(focusTarget as HTMLElement);
				}
			}
		}
	};

	return (
		<Cell
			tabIndex={status == 'edit' ? undefined : 0}
			className={props.className}
			colSpan={props.colSpan}
			id={colId}
			decorators={props.decorators}
			onDoubleClick={(e) => {
				if (handleViewOpenEdit(e)) {
					e.preventDefault();
					e.stopPropagation();
				}
			}}
			onKeyDown={(e) => {
				const row = e.currentTarget.closest('[data-ezdg-row]') as HTMLDivElement;
				kbEvents.handleCellKeyUp(e, getKeyUpArgs(row))
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
		<CellEdit {...props} rowContext={props.rowContext}>
			{props.Before?.()}
			{readOnly && <CellEditorReadWrapper {...props} />}
			{!readOnly && <CellEditorEditWrapper {...props} />}
			{props.After?.()}
			{errorMessage}
		</CellEdit>
	);
};
