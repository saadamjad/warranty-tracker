type Props = {
  defaultValue?: string;
  /** Live typing on the search page; omitted on Home, where the form submits to /search. */
  onQuery?: (query: string) => void;
  autoFocus?: boolean;
};

const PLACEHOLDER = "Search by product, store, or anything you remember";

export function SearchBox({ defaultValue, onQuery, autoFocus }: Props) {
  return (
    <form action="/search" role="search" onSubmit={onQuery ? (event) => event.preventDefault() : undefined}>
      <label htmlFor="search" className="sr-only">
        Search your purchases
      </label>
      <input
        id="search"
        name="q"
        type="search"
        defaultValue={defaultValue}
        placeholder={PLACEHOLDER}
        autoFocus={autoFocus}
        onChange={onQuery ? (event) => onQuery(event.target.value) : undefined}
        className="w-full rounded-card border border-line bg-background px-4 py-3"
      />
    </form>
  );
}
