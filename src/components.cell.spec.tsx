import { render, screen } from "@testing-library/react";
import { Cell, CellEdit } from "./components.cell";
import { EMPTY_ROW_CONTEXT } from "./types";

describe('module: components.cell', () => {
    describe.only('Cell', () => {
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

        // @todo validate on* handlers
        // @todo validate {tagIndex, decorators, id}
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
