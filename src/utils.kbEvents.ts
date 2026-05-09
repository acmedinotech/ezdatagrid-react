export const parseKeyUp =  (e: React.KeyboardEvent) => {
    let isEnter = false, isQuickEnter = false, isQuickShiftEnter = false, isEscape = false, isArrow = undefined;
    if (e.key == 'Enter') {
        isEnter = true;
        if (e.ctrlKey && e.key == 'Enter') {
        isQuickEnter = true;
        if (e.shiftKey && e.key == 'Enter') {
            isQuickShiftEnter = true;
        }
    }
    } else if (e.key.startsWith('Arrow')) {
        isArrow = {dir: e.key.substring(5).toLowerCase()};
    } else if (e.key == 'Escape') {
        isEscape = true;
    }
    return {
        isEnter,
        isQuickEnter,
        isQuickShiftEnter,
        isEscape,
        isArrow,
    }
}

export type HandleCellKeyUpArgs = {
	handleViewOpenEdit: (e: React.KeyboardEvent | React.MouseEvent) => boolean;
    handleQuickEnter: () => void;
    handleQuickShiftEnter: () => void;
    handleEnter: () => void;
    handleEscape: () => void;
    handleArrow: (arrow: {dir: string}) => void;
}

export const handleCellKeyUp = (e: React.KeyboardEvent, {handleViewOpenEdit, handleQuickEnter, handleQuickShiftEnter, handleEnter, handleEscape, handleArrow}: HandleCellKeyUpArgs) => {
    const { isEnter, isQuickEnter, isQuickShiftEnter, isEscape, isArrow: arrow } = parseKeyUp(e);

    if (isEscape) {
        e.preventDefault();
        e.stopPropagation();
        handleEscape();
    } else if (arrow) {
        handleArrow(arrow);
    } else if (isEnter) {
        if (handleViewOpenEdit(e)) {
            e.preventDefault();
            e.stopPropagation();
        } else if (isQuickEnter) {
            handleQuickEnter();
        }

        if (isQuickShiftEnter) {
          handleQuickShiftEnter();
        } else {
            handleEnter();
        }
    }
}