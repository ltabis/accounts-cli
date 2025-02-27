import { Paper, Skeleton, Stack, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useAccount } from "../../contexts/Account";
import { PieChart } from "@mui/x-charts";
import { getBalance, getCurrency } from "../../api";
import { useDispatchSnackbar } from "../../contexts/Snackbar";

export default function Details() {
  const account = useAccount()!;
  const dispatchSnackbar = useDispatchSnackbar()!;
  const [currency, setCurrency] = useState<string | null>(null);
  const [balance, setBalance] = useState(0.0);
  const [balanceNeeds, setBalanceNeeds] = useState(0.0);
  const [balanceWants, setBalanceWants] = useState(0.0);
  const [balanceSavings, setBalanceSavings] = useState(0.0);

  useEffect(() => {
    getCurrency(account.id).then(setCurrency);
    getBalance(account.id).then(setBalance);

    // TODO: get balances for the current month.
    getBalance(account.id, { tag: "needs" })
      .then((balance) => setBalanceNeeds((balance as number) * -1))
      .catch((error) =>
        dispatchSnackbar({ type: "open", severity: "error", message: error })
      );
    getBalance(account.id, { tag: "wants" })
      .then((balance) => setBalanceWants((balance as number) * -1))
      .catch((error) =>
        dispatchSnackbar({ type: "open", severity: "error", message: error })
      );
    getBalance(account.id, { tag: "savings" })
      .then((balance) => setBalanceSavings((balance as number) * -1))
      .catch((error) =>
        dispatchSnackbar({ type: "open", severity: "error", message: error })
      );
  }, [account, dispatchSnackbar]);

  return (
    <>
      <Paper elevation={0} sx={{ height: "100%", m: 10 }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={{ xs: 0, md: 4 }}
          sx={{ width: "100%", height: "100%" }}
        >
          <PieChart
            width={400}
            height={300}
            colors={["red", "orange", "blue"]}
            slotProps={{
              legend: { hidden: true },
            }}
            series={[
              {
                data: [
                  {
                    color: "red",
                    value: balanceNeeds,
                    label: "Needs",
                  },
                  {
                    color: "orange",
                    value: balanceWants,
                    label: "Wants",
                  },
                  {
                    color: "blue",
                    value: balanceSavings,
                    label: "Savings",
                  },
                ],
                arcLabel: (params) => params.label ?? "",
                innerRadius: 37,
                outerRadius: 100,
                paddingAngle: 5,
                cornerRadius: 5,
                startAngle: -45,
                endAngle: 225,
                cx: 150,
                cy: 150,
              },
              {
                data: [
                  {
                    color: "red",
                    value: 50,
                    label: "Needs",
                  },
                  {
                    color: "orange",
                    value: 30,
                    label: "Wants",
                  },
                  {
                    color: "blue",
                    value: 20,
                    label: "Savings",
                  },
                ],
                arcLabel: (params) =>
                  params.label ? `Ideal ${params.label}` : "",
                innerRadius: 110,
                outerRadius: 130,
                paddingAngle: 5,
                cornerRadius: 5,
                startAngle: -45,
                endAngle: 225,
                cx: 150,
                cy: 150,
              },
            ]}
          />

          <Stack spacing={1} sx={{ flexGrow: 1 }}>
            {
              // TODO: number animation.
              balance && currency ? (
                <Typography variant="h1" sx={{ m: 10 }}>
                  {`${balance.toFixed(2)} ${currency}`}
                </Typography>
              ) : (
                <Skeleton animation="wave" />
              )
            }
            {
              // TODO: number animation.
              balanceNeeds && currency ? (
                <Typography color="red" variant="h4">
                  {`${balanceNeeds.toFixed(2)} ${currency}`}
                </Typography>
              ) : (
                <Skeleton animation="wave" />
              )
            }
            {
              // TODO: number animation.
              balanceWants && currency ? (
                <Typography color="orange" variant="h4">
                  {`${balanceWants.toFixed(2)} ${currency}`}
                </Typography>
              ) : (
                <Skeleton animation="wave" />
              )
            }
            {
              // TODO: number animation.
              balanceSavings && currency ? (
                <Typography color="blue" variant="h4">
                  {`${balanceSavings.toFixed(2)} ${currency}`}
                </Typography>
              ) : (
                <Skeleton animation="wave" />
              )
            }
          </Stack>
        </Stack>
      </Paper>
    </>
  );
}
