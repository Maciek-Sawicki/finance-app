// Filterable transaction "types" accepted by query params - a superset of
// the schema's own `type` enum (income/expense) plus the query-only
// pseudo-types `exclude` and `transfer`.
export const TRANSACTION_FILTER_TYPES = ["income", "expense", "exclude", "transfer"];

// Category breakdown reports only ever group by the two real transaction types.
export const CATEGORY_TYPES = ["income", "expense"];
