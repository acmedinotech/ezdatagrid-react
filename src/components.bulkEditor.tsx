import { useContext, useEffect, useRef, useState } from "react";
import { ColumnDef, EZDataGridProps } from "./types";
import { CellEditor } from "./components.cell";
import { useRowState } from "./components.row";
import { Modal } from "./components.utility";
import { asHtmlElement, collectFormRowData } from "./helpers";
import { EZDGTableContextProvider } from "./components.table";

export type FormEditorProps = {
    columnDefs: ColumnDef[];
    labelFn?: (colDef: ColumnDef) => string;
    enableToggle?: boolean;
    toggleMode?: string;
}
export const FormEditor = ({ columnDefs, labelFn, enableToggle, toggleMode = 'allow' }: FormEditorProps) => {
    const { context } = useRowState({ status: 'edit', rowData: {} });
    let totalCols = 4;
    if (enableToggle) {
        totalCols++;
    }
    const ControlRow = (colDef: ColumnDef) => {
        return <div data-ezdg-row={totalCols} key={colDef.id}>
            {enableToggle && <div data-ezdg-cell data-ezdg-toolbar="inline">
                <span>{toggleMode}</span> <input type="checkbox" name="$formeditor_toggle" value={`${toggleMode}:${colDef.id}`} /> 
            </div>}
            <div data-ezdg-cell="2">
                <label htmlFor={`${colDef.id}`}>
                    {labelFn?.(colDef) ?? colDef.label ?? colDef.id}
                </label>
            </div>
            <CellEditor colDef={{ ...colDef, colSpan: 2 }} id={colDef.id} rowData={context.getRowData()} status="edit" rowContext={context} />
        </div>
    }
    return (
        <div data-ezdg-table data-ezdg-formeditor>
            {columnDefs.map(ControlRow)}
        </div>
    );
};

// @note returned function value in generic: ReturnType<typeof useBulkEditor>['ref']

export type BulkEditorSubscriber = (rowId: string | number, value: boolean, ctx: BulkEditorContext) => void;
export type BulkEditorContext = {
    getSelectedRows: () => Record<string, boolean>;
    countSelected: () => number;
    resetSelectedRows: () => void;
    makeToggleFn: (rowId: string) => (value: boolean) => void;
    subscribeToBulkEditor: (fn: BulkEditorSubscriber) => () => void;
}

export type BulkEditorButtonProps = {
    context: BulkEditorContext;
}

const ButtonBulkSave = ({context}: BulkEditorButtonProps) => {
    const tableCtx = useContext(EZDGTableContextProvider);
    return <button data-ezdg-action="$bulkedit_save" onClick={(e) => {
        const form = e.currentTarget.closest('[data-ezdg-modal-content]')?.querySelector('[data-ezdg-formeditor]');
        console.log(form)
        const formData = collectFormRowData(asHtmlElement(form as HTMLElement));
        const toggles = formData['$formeditor_toggle'] ?? [];
        const data: Record<string,any> = {};
        let count = 0;
        toggles.forEach((toggle: string) => {
            const [mode, id] = toggle.split(':');
            data[id] = formData[id];
            count++;
        });
        if (count === 0) {
            alert('You must select at least one column to update');
            return;
        }

        const selectedRows = context.getSelectedRows();
        console.log('batch update', {data, selectedRows});
        tableCtx.dataStore.batchUpdateRows?.({
            patch: data,
            selectedRows,
            rows: tableCtx.dataStore.getCurrentPage(),
            progressCallback: (prog) => {
                console.log('#'.repeat(prog.success) + 'X'.repeat(prog.errors) + '.'.repeat(prog.total - prog.success - prog.errors ), '/', prog.total);
            }
        });
    }}>save {context.countSelected()}</button>
}

const ButtonBulkDelete = ({context}: BulkEditorButtonProps) => {
    return <button data-ezdg-action="$bulkedit_delete" data-ezdg-button="link,red" disabled={true}>delete {context.countSelected()}</button>
}

const makeBulkEditAllBar = ({context, ...props}: BulkEditorButtonProps & Pick<EZDataGridProps, 'columnDefs'>) => {
    return function ButtonBulkEditAllBar() {
        const [isOpen, setIsOpen] = useState(false);
        const [isDisabled, setIsDisabled] = useState(true);

        useEffect(() => {
            return context.subscribeToBulkEditor((rowId, value) => {
                const disabled = context.countSelected() === 0;
                setIsDisabled(disabled);
            });
        }, [context]);
        
        return <div data-ezdg-toolbar="inline,border" data-ezdg-bulkeditor="true">
            <input type="checkbox" name="$bulkedit_select-all" onChange={(e) => {
                const isChecked = e.target.checked;
                const table = e.currentTarget.closest('[data-ezdg-table]');
                table?.querySelectorAll('[data-ezdg-row] input[name="$bulkedit_select-row"]')?.forEach((ele) => {
                    const input = ele as HTMLInputElement;
                    if (input.checked == isChecked) { return; }
                    input.click()
                });
            }} />
            <button onClick={() => setIsOpen(true)} disabled={isDisabled}>
                <span data-ezdg-toolbar>bulk</span>
            </button>
            {isOpen && <Modal closeFn={() => setIsOpen(false)}>
                <div style={{ width: '500px', height: '500px', backgroundColor: 'white' }}>
                    <h1>Bulk Edit</h1>
                    <FormEditor columnDefs={props.columnDefs} enableToggle={true} toggleMode='update' />
                    <div data-ezdg-toolbar="inline,border">
                        <ButtonBulkSave  context={context} />
                        <ButtonBulkDelete context={context} />
                    </div>
                </div>
            </Modal>}
        </div>
    }
}

export const useBulkEditor = (props: EZDataGridProps) => {
    const ref = useRef<{ selectedRows: Record<string, boolean>; subscriberCount: number; subscribers: Record<string, BulkEditorSubscriber> }>({ selectedRows: {}, subscriberCount: 0, subscribers: {} });

    const getSelectedRows = () => {
        return ref.current.selectedRows;
    }

    const countSelected = () => {
        return Object.values(ref.current.selectedRows).filter(v => v).length;
    }

    const resetSelectedRows = () => {
        ref.current.selectedRows = {};
    }

    const subscribeToBulkEditor = (fn: BulkEditorSubscriber) => {
        const subId = ref.current.subscriberCount++;
        ref.current.subscribers[subId] = fn;
        return () => {
            delete ref.current.subscribers[subId];
        }
    }

    const makeToggleFn = (rowId: string) => {
        return (value: boolean) => {
            ref.current.selectedRows[rowId] = value;
            Object.values(ref.current.subscribers).forEach((sub) => {
                sub(rowId, value, context);
            });
        }
    }

    const context: BulkEditorContext = {
        getSelectedRows,
        countSelected,
        resetSelectedRows,
        makeToggleFn,
        subscribeToBulkEditor,
    };

    return {
        ...context,
        BulkEditAllBar: makeBulkEditAllBar( {...props, context}),
        ref
    };
}