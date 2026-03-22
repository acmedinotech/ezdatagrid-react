import { useEffect, useRef, useState } from "react";
import { ColumnDef, EZDataGridProps } from "./types";
import { CellEditor } from "./components.cell";
import { useRowState } from "./components.row";
import { Modal } from "./components.utility";

export const FormEditor = ({ columnDefs }: { columnDefs: ColumnDef[] }) => {
    const { context } = useRowState({ status: 'edit', rowData: {} });
    const ControlRow = (colDef: ColumnDef) => {
        return <div data-ezdg-row="3" key={colDef.id}>
            <div data-ezdg-cell>
                <label htmlFor={`formeditor_${colDef.id}`}>
                    {colDef.label ?? colDef.id}
                </label>
            </div>
            <CellEditor colDef={{ ...colDef, colSpan: 2 }} id={colDef.id} rowData={context.getRowData()} status="edit" rowContext={context} />
        </div>
    }
    return (
        <div data-ezdg-table>
            {columnDefs.map(ControlRow)}
        </div>
    );
};

// @note returned function value in generic: ReturnType<typeof useBulkEditor>['ref']

export type BulkEditorSubscriber = (rowId: string | number, value: boolean, ctx: BulkEditorContext) => void;
export type BulkEditorContext = {
    getSelectedRows: () => Record<string, boolean>;
    resetSelectedRows: () => void;
    makeToggleFn: (rowId: string) => (value: boolean) => void;
    subscribeToBulkEditor: (fn: BulkEditorSubscriber) => () => void;
}

const makeBulkEditAllBar = (context: BulkEditorContext, props: Pick<EZDataGridProps, 'columnDefs'>) => {
    return function ButtonBulkEditAllBar() {
        const [isOpen, setIsOpen] = useState(false);
        const [isDisabled, setIsDisabled] = useState(true);

        useEffect(() => {
            return context.subscribeToBulkEditor((rowId, value) => {
                const disabled = Object.values(context.getSelectedRows()).filter(v => v).length === 0;
                setIsDisabled(disabled);
            });
        }, [context]);
        
        return <div data-ezdg-toolbar="inline,border">
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
                    <FormEditor columnDefs={props.columnDefs} />
                </div>
            </Modal>}
        </div>
    }
}

export const makeBulkModalBar = () => {

}

export const useBulkEditor = (props: EZDataGridProps) => {
    const ref = useRef<{ selectedRows: Record<string, boolean>; subscriberCount: number; subscribers: Record<string, BulkEditorSubscriber> }>({ selectedRows: {}, subscriberCount: 0, subscribers: {} });

    const getSelectedRows = () => {
        return ref.current.selectedRows;
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
                sub(rowId, value);
            });
        }
    }

    const me: BulkEditorContext = {
        getSelectedRows,
        resetSelectedRows,
        makeToggleFn,
        subscribeToBulkEditor,
    };

    return {
        ...me,
        BulkEditAllBar: makeBulkEditAllBar(me, props),
        ref
    };
}