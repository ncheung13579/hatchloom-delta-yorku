import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import Button from '../Button';
import Badge from '../Badge';
import Card from '../Card';
import Input from '../Input';
import Spinner from '../Spinner';
import EmptyState from '../EmptyState';
import MetricCard from '../MetricCard';
import Modal from '../Modal';
import Pagination from '../Pagination';
import { Table, Thead, Tbody, Th, Td } from '../Table';

// ---------------------------------------------------------------------------
// Button
// ---------------------------------------------------------------------------
describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('applies primary variant classes by default', () => {
    render(<Button>Primary</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('bg-gradient-to-br');
  });

  it('applies secondary variant classes', () => {
    render(<Button variant="secondary">Secondary</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('border-border');
    expect(btn.className).toContain('bg-card');
  });

  it('applies danger variant classes', () => {
    render(<Button variant="danger">Danger</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('bg-danger');
  });

  it('applies ghost variant classes', () => {
    render(<Button variant="ghost">Ghost</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('hover:bg-bg');
  });

  it('applies size classes', () => {
    const { rerender } = render(<Button size="sm">Small</Button>);
    expect(screen.getByRole('button').className).toContain('px-3');

    rerender(<Button size="lg">Large</Button>);
    expect(screen.getByRole('button').className).toContain('px-6');
  });

  it('is disabled when disabled prop is passed', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Press</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when disabled', () => {
    const handleClick = vi.fn();
    render(<Button disabled onClick={handleClick}>Nope</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('merges custom className', () => {
    render(<Button className="extra-class">Styled</Button>);
    expect(screen.getByRole('button').className).toContain('extra-class');
  });
});

// ---------------------------------------------------------------------------
// Badge
// ---------------------------------------------------------------------------
describe('Badge', () => {
  it('renders children', () => {
    render(<Badge>Active</Badge>);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('renders as a span', () => {
    render(<Badge>Tag</Badge>);
    expect(screen.getByText('Tag').tagName).toBe('SPAN');
  });

  it('applies default variant classes', () => {
    render(<Badge>Default</Badge>);
    expect(screen.getByText('Default').className).toContain('bg-primary/10');
    expect(screen.getByText('Default').className).toContain('text-primary');
  });

  it('applies success variant classes', () => {
    render(<Badge variant="success">Done</Badge>);
    expect(screen.getByText('Done').className).toContain('bg-success/10');
    expect(screen.getByText('Done').className).toContain('text-success');
  });

  it('applies danger variant classes', () => {
    render(<Badge variant="danger">Error</Badge>);
    expect(screen.getByText('Error').className).toContain('bg-danger/10');
    expect(screen.getByText('Error').className).toContain('text-danger');
  });

  it('applies warning variant classes', () => {
    render(<Badge variant="warning">Warn</Badge>);
    expect(screen.getByText('Warn').className).toContain('text-warning');
  });

  it('applies info variant classes', () => {
    render(<Badge variant="info">Info</Badge>);
    expect(screen.getByText('Info').className).toContain('text-teal');
  });

  it('applies muted variant classes', () => {
    render(<Badge variant="muted">Muted</Badge>);
    expect(screen.getByText('Muted').className).toContain('text-soft');
  });

  it('merges custom className', () => {
    render(<Badge className="my-class">Classy</Badge>);
    expect(screen.getByText('Classy').className).toContain('my-class');
  });
});

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------
describe('Card', () => {
  it('renders children', () => {
    render(<Card>Card content</Card>);
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('renders as a div', () => {
    render(<Card>Content</Card>);
    expect(screen.getByText('Content').tagName).toBe('DIV');
  });

  it('applies p-6 class when padding is true (default)', () => {
    render(<Card>Padded</Card>);
    expect(screen.getByText('Padded').className).toContain('p-6');
  });

  it('omits p-6 class when padding is false', () => {
    render(<Card padding={false}>No pad</Card>);
    expect(screen.getByText('No pad').className).not.toContain('p-6');
  });

  it('merges custom className', () => {
    render(<Card className="custom">Styled card</Card>);
    expect(screen.getByText('Styled card').className).toContain('custom');
  });

  it('passes extra HTML attributes', () => {
    render(<Card data-testid="my-card">Attr</Card>);
    expect(screen.getByTestId('my-card')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------
describe('Input', () => {
  it('renders label when provided', () => {
    render(<Input label="Username" />);
    expect(screen.getByText('Username')).toBeInTheDocument();
    expect(screen.getByLabelText('Username')).toBeInTheDocument();
  });

  it('associates label with input via htmlFor', () => {
    render(<Input label="Email Address" />);
    const input = screen.getByLabelText('Email Address');
    expect(input.id).toBe('email-address');
  });

  it('renders without label when label is omitted', () => {
    const { container } = render(<Input placeholder="Search..." />);
    expect(container.querySelector('label')).toBeNull();
  });

  it('renders placeholder', () => {
    render(<Input placeholder="Enter text" />);
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
  });

  it('renders error message when error prop is provided', () => {
    render(<Input label="Name" error="Required field" />);
    expect(screen.getByText('Required field')).toBeInTheDocument();
  });

  it('applies border-danger class when error is present', () => {
    render(<Input label="Name" error="Bad" />);
    const input = screen.getByLabelText('Name');
    expect(input.className).toContain('border-danger');
  });

  it('does not render error paragraph when error is absent', () => {
    const { container } = render(<Input label="Name" />);
    expect(container.querySelector('p')).toBeNull();
  });

  it('uses custom id when provided', () => {
    render(<Input label="Name" id="custom-id" />);
    expect(screen.getByLabelText('Name').id).toBe('custom-id');
  });

  it('merges custom className onto input element', () => {
    render(<Input label="Test" className="wide-input" />);
    expect(screen.getByLabelText('Test').className).toContain('wide-input');
  });
});

// ---------------------------------------------------------------------------
// Spinner
// ---------------------------------------------------------------------------
describe('Spinner', () => {
  it('renders spinner element', () => {
    const { container } = render(<Spinner />);
    const outerDiv = container.firstChild as HTMLElement;
    expect(outerDiv).toBeInTheDocument();
    expect(outerDiv.tagName).toBe('DIV');
  });

  it('contains an inner spinning div', () => {
    const { container } = render(<Spinner />);
    const innerDiv = container.querySelector('.animate-spin');
    expect(innerDiv).toBeInTheDocument();
  });

  it('applies custom className to outer wrapper', () => {
    const { container } = render(<Spinner className="mt-8" />);
    const outerDiv = container.firstChild as HTMLElement;
    expect(outerDiv.className).toContain('mt-8');
  });
});

// ---------------------------------------------------------------------------
// EmptyState
// ---------------------------------------------------------------------------
describe('EmptyState', () => {
  it('renders title', () => {
    render(<EmptyState title="No items found" />);
    expect(screen.getByText('No items found')).toBeInTheDocument();
  });

  it('renders title as h3', () => {
    render(<EmptyState title="Empty" />);
    expect(screen.getByText('Empty').tagName).toBe('H3');
  });

  it('renders description when provided', () => {
    render(<EmptyState title="Empty" description="Try adding some items" />);
    expect(screen.getByText('Try adding some items')).toBeInTheDocument();
  });

  it('does not render description paragraph when not provided', () => {
    const { container } = render(<EmptyState title="Empty" />);
    expect(container.querySelector('p')).toBeNull();
  });

  it('renders action when provided', () => {
    render(<EmptyState title="Empty" action={<button>Add Item</button>} />);
    expect(screen.getByRole('button', { name: 'Add Item' })).toBeInTheDocument();
  });

  it('does not render action wrapper when action is not provided', () => {
    const { container } = render(<EmptyState title="Empty" />);
    // Only the outer div and h3 should exist
    const outerDiv = container.firstChild as HTMLElement;
    expect(outerDiv.children).toHaveLength(1); // just h3
  });
});

// ---------------------------------------------------------------------------
// MetricCard
// ---------------------------------------------------------------------------
describe('MetricCard', () => {
  it('renders label', () => {
    render(<MetricCard label="Total Users" value={42} />);
    expect(screen.getByText('Total Users')).toBeInTheDocument();
  });

  it('renders value', () => {
    render(<MetricCard label="Count" value={123} />);
    expect(screen.getByText('123')).toBeInTheDocument();
  });

  it('renders string value', () => {
    render(<MetricCard label="Status" value="Active" />);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('renders detail when provided', () => {
    render(<MetricCard label="Revenue" value="$1k" detail="+12% from last month" />);
    expect(screen.getByText('+12% from last month')).toBeInTheDocument();
  });

  it('does not render detail when not provided', () => {
    const { container } = render(<MetricCard label="Revenue" value="$1k" />);
    const paragraphs = container.querySelectorAll('p');
    // label + value = 2 paragraphs, no detail
    expect(paragraphs).toHaveLength(2);
  });

  it('applies teal accent border class by default', () => {
    const { container } = render(<MetricCard label="Test" value={0} />);
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('border-l-teal');
  });

  it('applies primary accent border class', () => {
    const { container } = render(<MetricCard label="Test" value={0} accent="primary" />);
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('border-l-primary');
  });

  it('applies warning accent border class', () => {
    const { container } = render(<MetricCard label="Test" value={0} accent="warning" />);
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('border-l-warning');
  });

  it('applies danger accent border class', () => {
    const { container } = render(<MetricCard label="Test" value={0} accent="danger" />);
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('border-l-danger');
  });
});

// ---------------------------------------------------------------------------
// Modal
// ---------------------------------------------------------------------------
describe('Modal', () => {
  const noop = () => {};

  it('renders content when open', () => {
    render(
      <Modal open={true} onClose={noop} title="Test Modal">
        <p>Modal body</p>
      </Modal>,
    );
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Modal body')).toBeInTheDocument();
  });

  it('renders title as h2', () => {
    render(
      <Modal open={true} onClose={noop} title="Heading">
        Content
      </Modal>,
    );
    expect(screen.getByText('Heading').tagName).toBe('H2');
  });

  it('returns null when not open', () => {
    const { container } = render(
      <Modal open={false} onClose={noop} title="Hidden">
        <p>Hidden content</p>
      </Modal>,
    );
    expect(container.innerHTML).toBe('');
  });

  it('calls onClose when close button is clicked', () => {
    const handleClose = vi.fn();
    render(
      <Modal open={true} onClose={handleClose} title="Close Test">
        Body
      </Modal>,
    );
    // The close button renders the multiplication sign
    const closeBtn = screen.getByRole('button');
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when overlay is clicked', () => {
    const handleClose = vi.fn();
    const { container } = render(
      <Modal open={true} onClose={handleClose} title="Overlay Test">
        Body
      </Modal>,
    );
    // The overlay is the first child div with bg-black/20 class
    const overlay = container.querySelector('.bg-black\\/20') as HTMLElement;
    fireEvent.click(overlay);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('renders children', () => {
    render(
      <Modal open={true} onClose={noop} title="Test">
        <span data-testid="child">Hello</span>
      </Modal>,
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('applies max-w-2xl when wide is true', () => {
    const { container } = render(
      <Modal open={true} onClose={noop} title="Wide" wide={true}>
        Content
      </Modal>,
    );
    const panel = container.querySelector('.max-w-2xl');
    expect(panel).toBeInTheDocument();
  });

  it('applies max-w-lg when wide is false (default)', () => {
    const { container } = render(
      <Modal open={true} onClose={noop} title="Narrow">
        Content
      </Modal>,
    );
    const panel = container.querySelector('.max-w-lg');
    expect(panel).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------
describe('Pagination', () => {
  it('returns null when lastPage is 1', () => {
    const { container } = render(
      <Pagination currentPage={1} lastPage={1} onPageChange={() => {}} total={5} perPage={15} />,
    );
    expect(container.innerHTML).toBe('');
  });

  it('returns null when lastPage is 0', () => {
    const { container } = render(
      <Pagination currentPage={1} lastPage={0} onPageChange={() => {}} />,
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders page info text', () => {
    render(
      <Pagination currentPage={1} lastPage={3} onPageChange={() => {}} total={45} perPage={15} />,
    );
    expect(screen.getByText(/Showing 1/)).toBeInTheDocument();
    expect(screen.getByText(/of 45/)).toBeInTheDocument();
  });

  it('renders Previous and Next buttons', () => {
    render(
      <Pagination currentPage={2} lastPage={3} onPageChange={() => {}} total={45} perPage={15} />,
    );
    expect(screen.getByRole('button', { name: 'Previous' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument();
  });

  it('disables Previous button on first page', () => {
    render(
      <Pagination currentPage={1} lastPage={3} onPageChange={() => {}} total={45} perPage={15} />,
    );
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next' })).not.toBeDisabled();
  });

  it('disables Next button on last page', () => {
    render(
      <Pagination currentPage={3} lastPage={3} onPageChange={() => {}} total={45} perPage={15} />,
    );
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Previous' })).not.toBeDisabled();
  });

  it('calls onPageChange with previous page when Previous is clicked', () => {
    const handleChange = vi.fn();
    render(
      <Pagination currentPage={2} lastPage={3} onPageChange={handleChange} total={45} perPage={15} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Previous' }));
    expect(handleChange).toHaveBeenCalledWith(1);
  });

  it('calls onPageChange with next page when Next is clicked', () => {
    const handleChange = vi.fn();
    render(
      <Pagination currentPage={2} lastPage={3} onPageChange={handleChange} total={45} perPage={15} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(handleChange).toHaveBeenCalledWith(3);
  });

  it('shows correct range for middle page', () => {
    render(
      <Pagination currentPage={2} lastPage={3} onPageChange={() => {}} total={45} perPage={15} />,
    );
    expect(screen.getByText(/Showing 16/)).toBeInTheDocument();
    expect(screen.getByText(/of 45/)).toBeInTheDocument();
  });

  it('caps end range to total on last page', () => {
    render(
      <Pagination currentPage={3} lastPage={3} onPageChange={() => {}} total={40} perPage={15} />,
    );
    // Page 3: start=31, end=min(45,40)=40
    expect(screen.getByText(/Showing 31/)).toBeInTheDocument();
    expect(screen.getByText(/of 40/)).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Table
// ---------------------------------------------------------------------------
describe('Table', () => {
  it('renders Table with children', () => {
    render(
      <Table>
        <tbody>
          <tr>
            <td>Cell</td>
          </tr>
        </tbody>
      </Table>,
    );
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByText('Cell')).toBeInTheDocument();
  });

  it('applies custom className to Table', () => {
    render(
      <Table className="my-table">
        <tbody>
          <tr>
            <td>Data</td>
          </tr>
        </tbody>
      </Table>,
    );
    expect(screen.getByRole('table').className).toContain('my-table');
  });

  it('renders Thead with children', () => {
    render(
      <table>
        <Thead>
          <tr>
            <th>Header</th>
          </tr>
        </Thead>
      </table>,
    );
    expect(screen.getByText('Header')).toBeInTheDocument();
  });

  it('renders Tbody with children', () => {
    render(
      <table>
        <Tbody>
          <tr>
            <td>Row data</td>
          </tr>
        </Tbody>
      </table>,
    );
    expect(screen.getByText('Row data')).toBeInTheDocument();
  });

  it('renders Th with children', () => {
    render(
      <table>
        <thead>
          <tr>
            <Th>Column</Th>
          </tr>
        </thead>
      </table>,
    );
    expect(screen.getByRole('columnheader', { name: 'Column' })).toBeInTheDocument();
  });

  it('applies custom className to Th', () => {
    render(
      <table>
        <thead>
          <tr>
            <Th className="wide-col">Name</Th>
          </tr>
        </thead>
      </table>,
    );
    expect(screen.getByRole('columnheader', { name: 'Name' }).className).toContain('wide-col');
  });

  it('renders Td with children', () => {
    render(
      <table>
        <tbody>
          <tr>
            <Td>Value</Td>
          </tr>
        </tbody>
      </table>,
    );
    expect(screen.getByRole('cell', { name: 'Value' })).toBeInTheDocument();
  });

  it('applies custom className to Td', () => {
    render(
      <table>
        <tbody>
          <tr>
            <Td className="highlight">Important</Td>
          </tr>
        </tbody>
      </table>,
    );
    expect(screen.getByRole('cell', { name: 'Important' }).className).toContain('highlight');
  });

  it('renders full Table composition with all sub-components', () => {
    render(
      <Table>
        <Thead>
          <tr>
            <Th>Name</Th>
            <Th>Age</Th>
          </tr>
        </Thead>
        <Tbody>
          <tr>
            <Td>Alice</Td>
            <Td>30</Td>
          </tr>
        </Tbody>
      </Table>,
    );
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Name' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Age' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Alice' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: '30' })).toBeInTheDocument();
  });
});
