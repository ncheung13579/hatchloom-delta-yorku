// Previous/Next pagination bar with "Showing X-Y of Z" summary.
import Button from './Button';

interface PaginationProps {
  currentPage: number;
  lastPage: number;
  onPageChange: (page: number) => void;
  total?: number;
  perPage?: number;
}

export default function Pagination({ currentPage, lastPage, onPageChange, total, perPage }: PaginationProps) {
  if (lastPage <= 1) return null;

  // Calculate the 1-based range of items visible on the current page.
  // start: first item index; end: last item index, capped at total.
  const start = (currentPage - 1) * (perPage || 15) + 1;
  const end = Math.min(currentPage * (perPage || 15), total || 0);

  return (
    <div className="flex items-center justify-between px-5 py-3.5 border-t border-border">
      {total != null && (
        <p className="text-[0.82rem] text-soft">
          Showing {start}–{end} of {total}
        </p>
      )}
      <div className="flex gap-1.5">
        <Button
          variant="secondary"
          size="sm"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          Previous
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={currentPage >= lastPage}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
