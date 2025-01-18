import { Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Fab, MenuItem, Paper, Select, Skeleton, TextField, Typography } from "@mui/material";
import { invoke } from "@tauri-apps/api/core";
import { FormEvent, useEffect, useState, SetStateAction, Dispatch } from "react";
import AddIcon from '@mui/icons-material/Add';
import { Transaction2 } from "../../../../cli/bindings/Transaction2";
import { TransactionWithId } from "../../../../cli/bindings/TransactionWithId";
import { useAccount } from "../../contexts/Account";
import { DataGrid, GridColDef, GridRenderCellParams, GridRenderEditCellParams, useGridApiContext } from "@mui/x-data-grid";
import { EditTags } from "./Tags";
import { Tag } from "../../../../cli/bindings/Tag";

const filterFloat = (value: string) => /^(-|\+)?([0-9]+(\.[0-9]+)?)$/.test(value.replace(",", ".")) ? Number(value.replace(",", ".")) : NaN;

function AddTransaction({ open, setOpen }: { open: boolean, setOpen: Dispatch<SetStateAction<boolean>> }) {
    const account = useAccount()!;
    // Note: omit amount float value to enable the user to enter a floating point character.
    const [form, setForm] = useState<Omit<Transaction2, "amount" | "date"> & { amount: string }>({
        amount: "0",
        description: "",
        operation: "s",
        tags: []
    });

    const handleCloseForm = () => {
        setOpen(false);
    };

    const handleValidAmount = () => isNaN(parseFloat(form.amount));

    const handleTransactionSubmission = async () => {
        const amount = filterFloat(form.amount);

        // FIXME: refresh table.
        invoke("add_transaction", { account, ...form, amount })
            .then(() => {
                handleCloseForm();
            })
            .catch(error => console.error(error));
    }

    return (
        <Dialog
            open={open}
            onClose={handleCloseForm}
            PaperProps={{
                component: 'form',
                onSubmit: async (event: FormEvent<HTMLFormElement>) => {
                    event.preventDefault();
                    return handleTransactionSubmission();
                },

            }}
        >
            <DialogTitle>Add transaction</DialogTitle>
            <DialogContent>
                <Select
                    autoFocus
                    required
                    sx={{ m: 1 }}
                    id="transaction-operation"
                    label="Operation"
                    name="operation"
                    value={form.operation}
                    onChange={(operation) => setForm({ ...form, operation: operation.target.value })}
                >
                    <MenuItem value={"s"}>Expense</MenuItem>
                    <MenuItem value={"i"}>Income</MenuItem>
                </Select>
                <TextField
                    sx={{ m: 1 }}
                    id="transaction-amount"
                    label="Amount"
                    name="amount"
                    slotProps={{
                        inputLabel: {
                            shrink: true,
                        },
                    }}
                    value={form.amount}
                    onChange={(amount) => setForm({ ...form, amount: amount.target.value })}
                    error={handleValidAmount()}
                    helperText={handleValidAmount() && "Not a valid amount"}
                />
                <TextField
                    sx={{ m: 1 }}
                    id="transaction-description"
                    label="Description"
                    name="description"
                    value={form.description}
                    onChange={(description) => setForm({ ...form, description: description.target.value })}
                />
                <EditTags
                    value={form.tags}
                    handleChange={(tags) => setForm({ ...form, tags })}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={handleCloseForm}>Cancel</Button>
                <Button disabled={handleValidAmount()} type="submit">Add</Button>
            </DialogActions>
        </Dialog>
    );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function EditTagsTable(props: GridRenderEditCellParams<any, Tag[]>) {
    const { id, value, field } = props;
    const apiRef = useGridApiContext();

    const handleChange = (newTags: Tag[]) => {
        // FIXME: only add new tags.
        invoke("add_tags", { tags: newTags }).catch((error) =>
            // FIXME: show error to client.
            console.error("failed to store tags", error));
        apiRef.current.setEditCellValue({ id, field, value: newTags });
        apiRef.current.stopCellEditMode({ id, field });
    }

    return (
        <EditTags value={value} handleChange={handleChange} />
    );
}

export default function Transactions() {
    const account = useAccount()!;
    const [open, setOpen] = useState(false);
    const [currency, setCurrency] = useState<string | null>(null);
    const [transactions, setTransactions] = useState<TransactionWithId[] | null>(null);
    const [balance, setBalance] = useState(0.0);

    const columns: GridColDef[] = [
        { field: 'description', headerName: 'Description', minWidth: 500, editable: true },
        { field: 'date', headerName: 'Date', type: "dateTime", minWidth: 175, valueGetter: (value) => new Date(value), editable: true },
        { field: 'amount', headerName: 'Amount', editable: true },
        {
            field: 'tags', type: "custom", headerName: 'Tags', minWidth: 200,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            renderCell: (params: GridRenderCellParams<any, Tag[]>) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {params.value?.map(item => <Chip key={`${params.id}-${item.label}`} label={item.label} />)}
                </Box>
            ),
            renderEditCell: (params) => <EditTagsTable {...params} />,
            editable: true
        },
    ];

    const paginationModel = { page: 0, pageSize: 10 };

    function getRowId(row: TransactionWithId) {
        return row.id.id.String;
    }

    const handleOpenForm = () => {
        setOpen(true);
    };

    const handleRowUpdate = (newRow: TransactionWithId) => {
        invoke("update_transaction", { transaction: newRow });
        return newRow;
    }

    useEffect(() => {
        invoke("get_currency", { account })
            .then((currency) => setCurrency(currency as string));
        invoke("get_transactions", { account })
            .then((transactions) => setTransactions(transactions as TransactionWithId[]));
        invoke("get_balance", { account })
            .then((balance) => setBalance(balance as number));
    }, [account]);

    return (
        <Paper elevation={0}>
            {
                balance && currency
                    ? (
                        <Typography variant="h6" >
                            {`${balance.toFixed(2)} ${currency}`}
                        </Typography>
                    )
                    : (
                        <Skeleton animation="wave" />
                    )
            }

            {transactions ?
                <Box sx={{ height: 600, width: '100%' }}>
                    <DataGrid
                        rows={transactions}
                        columns={columns}
                        getRowId={getRowId}
                        initialState={{ pagination: { paginationModel } }}
                        pageSizeOptions={[5, 10, 25, 50, 100]}
                        checkboxSelection
                        // TODO: update data.
                        processRowUpdate={handleRowUpdate}
                        onProcessRowUpdateError={(error) => console.error("update error", error)}
                    />

                </Box>
                : <>
                    <Skeleton animation="wave" />
                    <Skeleton animation="wave" />
                    <Skeleton animation="wave" />
                </>
            }

            {/* TODO: Add transfer option between two accounts */}
            <Fab color="primary" aria-label="add" sx={{
                position: 'absolute',
                bottom: 16,
                right: 16,
            }}
                onClick={handleOpenForm}
            >
                <AddIcon />
            </Fab>

            <AddTransaction open={open} setOpen={setOpen} />
        </Paper>
    );
}