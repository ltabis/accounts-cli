// This file was generated by [ts-rs](https://github.com/Aleph-Alpha/ts-rs). Do not edit this file manually.
import type { Item } from "./Item";

export type TransactionWithId = { id: { tb: string, id: { String: string }}, } & ({ "operation": "i" } & Item | { "operation": "s" } & Item);
