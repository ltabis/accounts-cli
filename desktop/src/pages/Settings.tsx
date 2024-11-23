import { useEffect, } from "react";
import { Button, FormControl, InputLabel, MenuItem, Paper, Select, SelectChangeEvent, TextField } from "@mui/material";
import { Theme } from "../../../cli/bindings/Theme";
import { Settings as AppSettings } from "../../../cli/bindings/Settings";
import { invoke } from "@tauri-apps/api/core";
import { useDispatchSettings, useSettings } from "../contexts/Settings";

export default function Settings() {
    const settings = useSettings();
    const dispatch = useDispatchSettings()!;

    useEffect(() => {
        invoke("get_settings").then(
            (newSettings) => {
                console.log("PASSED", JSON.stringify(newSettings), (newSettings as AppSettings).theme);
                dispatch({ type: "update", settings: newSettings as AppSettings });
            }
        ).catch(
            (error) => {
                console.error(error);
            }
        );
    }, [dispatch]);

    return settings
        ?
        (<>
            <Paper elevation={0}>
                <TextField id="outlined-basic" label="Accounts path" variant="outlined"
                    value={settings.accounts_path}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                        dispatch(
                            {
                                type: "update",
                                settings: {
                                    ...settings,
                                    accounts_path: event.target.value
                                }
                            }
                        )
                    }}
                />
                <FormControl>
                    <InputLabel id="demo-simple-select-label">Theme</InputLabel>
                    <Select
                        labelId="demo-simple-select-label"
                        id="demo-simple-select"
                        value={settings.theme}
                        label="Theme"
                        onChange={(event: SelectChangeEvent) => {
                            dispatch({
                                type: "update",
                                settings: {
                                    ...settings,
                                    theme: event.target.value as Theme
                                }
                            });
                        }}
                    >
                        <MenuItem value={"system"}>System</MenuItem>
                        <MenuItem value={"light"}>Light</MenuItem>
                        <MenuItem value={"dark"}>Dark</MenuItem>
                    </Select>
                </FormControl>
                <Button variant="text" onClick={() => dispatch({
                    type: "save"
                })}>Save</Button>
            </Paper >
        </>)
        :
        (<></>)
}