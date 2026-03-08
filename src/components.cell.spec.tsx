import { fireEvent, render, screen } from "@testing-library/react";
import { Cell, CellEdit } from "./components.cell";
import { EMPTY_ROW_CONTEXT } from "./types";

describe('module: components.cell', () => {
    describe('Cell', () => {
        it('renders Cell {children}', () => {
            render(<Cell>test</Cell>);

            const htmlCell = screen.getByText('test');
            expect(htmlCell).toBeInTheDocument();
            expect(htmlCell.dataset.ezdgCell).toEqual("1")
        })
        it('renders Cell {colSpan, className, children}', () => {
            const cell = render(<Cell colSpan={2} className="test-class"><b>test</b></Cell>);

            const bCell = screen.getByText('test');
            expect(bCell.tagName.toLowerCase()).toEqual("b");

            const divCell = bCell.parentElement;
            expect(divCell).toHaveClass("test-class");
            expect(divCell?.dataset.ezdgCell).toEqual("2")
        })
        it('renders Cell {Before, After, children}', () => {
            render(<Cell Before={() => <div className="before">Before</div>} After={() => <div className="after">After</div>}>test</Cell>);
            const textCell = screen.getByText('test');
            expect(textCell).toBeInTheDocument();

            const before = screen.getByText('Before');
            expect(before).toHaveClass("before");
            expect(before).toBeInTheDocument();

            const after = screen.getByText('After');
            expect(after).toBeInTheDocument();
            expect(after).toHaveClass("after");
        })
        it('renders Cell {tabIndex, decorators, id}', () => {
            render(<Cell tabIndex={1} decorators="wrap" id="c1">test</Cell>);
            const htmlCell = screen.getByText('test');
            expect(htmlCell).toBeInTheDocument();
            expect(htmlCell.tabIndex).toEqual(1)
            expect(htmlCell.dataset.ezdgDecorators).toEqual("wrap")
            expect(htmlCell.dataset.ezdgColindex).toEqual("c1")
        })
        it('renders Cell {onClick, onDoubleClick, onKeyDown, onKeyUp, onMouseEnter, onMouseOver, onMouseLeave}', () => {
            const callMap: Record<string, boolean> = {};
            const onClick = () => { callMap['onClick'] = true };
            const onDoubleClick = () => { callMap['onDoubleClick'] = true };
            const onKeyDown = () => { callMap['onKeyDown'] = true };
            const onKeyUp = () => { callMap['onKeyUp'] = true };
            const onMouseEnter = () => { callMap['onMouseEnter'] = true };
            const onMouseOver = () => { callMap['onMouseOver'] = true };
            const onMouseLeave = () => { callMap['onMouseLeave'] = true };
            
            render(<Cell onClick={onClick} onDoubleClick={onDoubleClick} onKeyDown={onKeyDown} onKeyUp={onKeyUp} onMouseEnter={onMouseEnter} onMouseOver={onMouseOver} onMouseLeave={onMouseLeave}>test</Cell>);
            const htmlCell = screen.getByText('test');
            fireEvent.click(htmlCell);
            fireEvent.doubleClick(htmlCell);
            fireEvent.keyDown(htmlCell);
            fireEvent.keyUp(htmlCell);
            fireEvent.mouseEnter(htmlCell);
            fireEvent.mouseOver(htmlCell);
            fireEvent.mouseLeave(htmlCell);
            expect(callMap['onClick']).toBe(true);
            expect(callMap['onDoubleClick']).toBe(true);
            expect(callMap['onKeyDown']).toBe(true);
            expect(callMap['onKeyUp']).toBe(true);
            expect(callMap['onMouseEnter']).toBe(true);
            expect(callMap['onMouseOver']).toBe(true);
            expect(callMap['onMouseLeave']).toBe(true);
        })
    });
    describe('CellEdit', () => {
        it('renders CellEdit {children}', () => {
            render(<CellEdit rowContext={EMPTY_ROW_CONTEXT}>test</CellEdit>);
            const htmlCell = screen.getByText('test');
            expect(htmlCell).toBeInTheDocument();
            expect(htmlCell.dataset.ezdgCell).toEqual("1")
        })
    })
});
