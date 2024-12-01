import { Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Fab, FormControl, MenuItem, Paper, Select, Skeleton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from "@mui/material";
import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import AddIcon from '@mui/icons-material/Add';
import { Transaction } from "../../../../cli/bindings/Transaction";
import { useAccount } from "../../contexts/Account";
import { useSettings } from "../../contexts/Settings";

function AddTransaction({ open, setOpen }: { open: boolean, setOpen: any }) {
    const settings = useSettings()!;
    const account = useAccount()!;

    const handleCloseForm = () => {
        setOpen(false);
    };

    const handleTransactionSubmission = async (formData: FormData) => {
        const formJson = Object.fromEntries((formData as any).entries());
        const transaction = {
            ...formJson,
            // On autofill we get a stringified value.
            tags: typeof formJson.tags === 'string' ? formJson.tags.split(',') : formJson.tags,
            amount: parseFloat(formJson.amount),
            date: await invoke("get_date"),
        } as Transaction;

        invoke("add_transaction", { account, transaction })
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
                onSubmit: async (event: React.FormEvent<HTMLFormElement>) => {
                    event.preventDefault();
                    return handleTransactionSubmission(new FormData(event.currentTarget));
                },
            }}
        >
            <DialogTitle>Add transaction</DialogTitle>
            <DialogContent>
                <FormControl>
                    <Select
                        autoFocus
                        required
                        id="transaction-operation"
                        label="Operation"
                        name="operation"
                        value={"s"}
                        sx={{ m: 1 }}
                    >
                        <MenuItem value={"s"}>Expense</MenuItem>
                        <MenuItem value={"i"}>Income</MenuItem>
                    </Select>
                    <TextField
                        sx={{ m: 1 }}
                        id="transaction-amount"
                        label="Amount"
                        name="amount"
                        type="number"
                        slotProps={{
                            inputLabel: {
                                shrink: true,
                            },
                        }}
                    />
                    <TextField
                        sx={{ m: 1 }}
                        id="transaction-description"
                        label="Description"
                        name="description"
                    />
                    <Select
                        sx={{ m: 1 }}
                        id="transaction-tags"
                        label="Tags"
                        name="tags"
                        multiple
                        value={[]}
                    >
                        {
                            [(
                                <MenuItem
                                    key="transaction-add-tag"
                                    value="Add a tag"
                                >
                                    <Button variant="outlined" startIcon={<AddIcon />}>
                                        Add tag
                                    </Button>
                                </MenuItem>
                            )].concat(
                                settings.tags.map((name) => (
                                    <MenuItem key={name} value={name}>
                                        {name}
                                    </MenuItem>
                                ))
                            )
                        }
                    </Select>
                </FormControl>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleCloseForm}>Cancel</Button>
                <Button type="submit">Add</Button>
            </DialogActions>
        </Dialog>
    );
}

export default function Transactions() {
    const account = useAccount()!;
    const [open, setOpen] = useState(false);
    const [currency, setCurrency] = useState<string | null>(null);
    const [transactions, setTransactions] = useState<Transaction[] | null>(null);
    const [balance, setBalance] = useState(0.0);

    const handleOpenForm = () => {
        setOpen(true);
    };

    useEffect(() => {
        invoke("get_currency", { accountName: account })
            .then((currency) => setCurrency(currency as string));
        invoke("get_transactions", { accountName: account })
            .then((transactions) => setTransactions(transactions as Transaction[]));
        invoke("get_balance", { accountName: account })
            .then((balance) => setBalance(balance as number));
    });

    return (
        <>
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
                    <TableContainer component={Paper} sx={{ maxHeight: 440 }}>
                        <Table stickyHeader sx={{ minWidth: 650 }} >
                            <TableHead>
                                <TableRow>
                                    <TableCell align="right">description</TableCell>
                                    <TableCell align="right">tags</TableCell>
                                    <TableCell align="right">amount</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {
                                    transactions.map((t, index) => (
                                        <TableRow
                                            key={index}
                                            sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                        >
                                            <TableCell align="right">{t.description}</TableCell>
                                            <TableCell align="right">{t.tags.map((tag) => (<Chip key={`${index}-${tag}`} label={tag}></Chip>))}</TableCell>
                                            <TableCell align="right">
                                                <Chip
                                                    label={`${t.operation === "i" ? "+" : "-"}${t.amount}`}
                                                    color={t.operation === "i" ? "success" : "error"}
                                                    variant="outlined"
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))
                                }
                            </TableBody>
                        </Table>
                    </TableContainer>
                    : <>
                        <Skeleton animation="wave" />
                        <Skeleton animation="wave" />
                        <Skeleton animation="wave" />
                    </>
                }

                <Fab color="primary" aria-label="add" sx={{
                    position: 'absolute',
                    bottom: 16,
                    right: 16,
                }}
                    onClick={handleOpenForm}
                >
                    <AddIcon />
                </Fab>

                <AddTransaction open={open} setOpen={setOpen}></AddTransaction>
            </Paper>
        </>
    );
}