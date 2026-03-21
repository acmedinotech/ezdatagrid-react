export const Modal = ({ closeFn, children }: { closeFn: () => void } & React.PropsWithChildren) => {
    return <div data-ezdg-backdrop onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
    }} onDoubleClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
    }}>
        <div data-ezdg-modal>
            <div data-ezdg-toolbar="right"><button onClick={() => closeFn()}>close</button></div>
            {children}
        </div>
    </div>
}