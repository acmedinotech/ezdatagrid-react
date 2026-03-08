import { render, screen } from "@testing-library/react";
import { Cell } from "./components.cell";

describe('module: components.cell', () => {
    describe('Cell', () => {
        it('renders Cell {children}', () => {
            render(<Cell>test</Cell>);

            const htmlCell = screen.getByText('test');
            expect(htmlCell).toBeInTheDocument();
            expect(htmlCell.dataset.ezdgCell).toEqual("1")
        })
        it('renders Cell {colSpan, className, children}', () => {
            render(<Cell colSpan={2} className="test-class"><b>test</b></Cell>);

            const htmlCell = screen.getByText('test');
            expect(htmlCell.tagName.toLowerCase()).toEqual("b");
            expect(htmlCell).toHaveClass("test-class");
            expect(htmlCell.dataset.ezdgCell).toEqual("2")
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
    });
});
