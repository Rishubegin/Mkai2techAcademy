import { Button } from "@/components/ui/button";

// Shared pager for the admin tables. Every paginated list endpoint answers with
// the same { page, limit, total, pages } object, so each table only has to hand
// that straight through along with a setter for the page number.
const Pagination = ({ pagination, onPageChange, label = "items" }) => {
  if (!pagination) return null;

  const { page = 1, limit = 0, total = 0 } = pagination;
  // Older endpoints report 0 pages for an empty list; treat that as one page.
  const pages = Math.max(1, pagination.pages || 1);

  if (total === 0) return null;

  const firstOnPage = (page - 1) * limit + 1;
  const lastOnPage = Math.min(page * limit, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
      <p className="text-xs text-muted-foreground">
        Showing {firstOnPage}–{lastOnPage} of {total} {label}
      </p>

      {pages > 1 && (
        <div className="flex items-center gap-2">
          <Button
            size="xs"
            variant="outline"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
          >
            Previous
          </Button>
          <span className="text-xs text-muted-foreground">
            Page {page} of {pages}
          </span>
          <Button
            size="xs"
            variant="outline"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= pages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

export default Pagination;
