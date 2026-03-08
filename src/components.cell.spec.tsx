import { render, screen } from "@testing-library/react";
import { Cell } from "./components.cell";

describe('module: components.cell', () => {
    describe('Cell', () => {
        it('renders Cell', () => {
            const cell = render(<Cell>test</Cell>);
            expect(screen.getByText('test')).toBeInTheDocument();
        })
    });
});
