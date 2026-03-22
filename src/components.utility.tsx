import { useEffect } from "react";

export const Modal = ({ closeFn, children }: { closeFn: () => void } & React.PropsWithChildren) => {
    const volatileId = `modal-${new Date().getTime()}`;
    useEffect(() => {
        document.getElementById(volatileId)?.focus();
    })
    return (<div id={volatileId} onKeyUp={(e) => {
        if (e.key === 'Escape') {
            closeFn();
        }
    }}>
        <div data-ezdg-backdrop onClick={(e) => {
            // console.log('click.backdrop');
            e.stopPropagation();
            e.preventDefault();
        }} onDoubleClick={(e) => {
            // console.log('dblclick.backdrop');
            e.stopPropagation();
            e.preventDefault();
        }}
        onKeyUp={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}>
        </div>
        <div data-ezdg-modal onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
        }} onFocus={() => {
            // console.log('focus.modal');
        }}>
            <div data-ezdg-toolbar="right"><button onClick={() => closeFn()}>close</button></div>
            {children}
        </div>
    </div>
    );
}