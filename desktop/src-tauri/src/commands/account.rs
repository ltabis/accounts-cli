use surrealdb::engine::local::Db;
use surrealdb::Surreal;
use tauri::State;
use thunes_cli::account::Account;
use thunes_cli::transaction::TransactionWithId;
use thunes_cli::{
    AddAccountOptions, AddTransactionOptions, BalanceOptions, CurrencyBalance,
    GetTransactionOptions,
};

pub type Accounts = std::collections::HashMap<String, Account>;

// TODO: Make errors understandable by users.
// FIXME: unwraps.

#[tauri::command]
#[tracing::instrument(skip(database), ret(level = tracing::Level::DEBUG))]
pub async fn get_account(
    database: State<'_, tokio::sync::Mutex<Surreal<Db>>>,
    account_name: &str,
) -> Result<Account, String> {
    let database = database.lock().await;
    thunes_cli::get_account(&database, account_name)
        .await
        .map_err(|error| error.to_string())
}

#[tauri::command]
#[tracing::instrument(skip(database), ret(level = tracing::Level::DEBUG))]
pub async fn update_account(
    database: State<'_, tokio::sync::Mutex<Surreal<Db>>>,
    account: Account,
) -> Result<(), String> {
    let database = database.lock().await;

    thunes_cli::update_account(&database, account)
        .await
        .map_err(|error| error.to_string())
}

#[tauri::command]
#[tracing::instrument(skip(database), ret(level = tracing::Level::DEBUG))]
pub async fn list_accounts(
    database: State<'_, tokio::sync::Mutex<Surreal<Db>>>,
) -> Result<Vec<String>, ()> {
    let database = database.lock().await;
    let accounts: Vec<Account> = database.select("account").await.unwrap();

    Ok(accounts
        .into_iter()
        .map(|account| account.data.name)
        .collect())
}

#[tauri::command]
#[tracing::instrument(skip(database), ret(level = tracing::Level::DEBUG))]
pub async fn add_account(
    database: State<'_, tokio::sync::Mutex<Surreal<Db>>>,
    options: AddAccountOptions,
) -> Result<Account, String> {
    let database = database.lock().await;

    thunes_cli::add_account(&database, options)
        .await
        .map_err(|error| error.to_string())
}

#[tauri::command]
#[tracing::instrument(skip(database), ret(level = tracing::Level::DEBUG))]
pub async fn delete_account(
    database: State<'_, tokio::sync::Mutex<Surreal<Db>>>,
    account_name: &str,
) -> Result<(), String> {
    let database = database.lock().await;

    thunes_cli::delete_account(&database, account_name)
        .await
        .map_err(|error| error.to_string())
}

#[tauri::command]
#[tracing::instrument(skip(database), ret(level = tracing::Level::DEBUG))]
pub async fn get_balance(
    database: State<'_, tokio::sync::Mutex<Surreal<Db>>>,
    account_name: &str,
    options: Option<BalanceOptions>,
) -> Result<f64, ()> {
    let database = database.lock().await;
    thunes_cli::balance(&database, account_name, options.unwrap_or_default())
        .await
        .map_err(|_| ())
}

#[tauri::command]
#[tracing::instrument(skip(database), ret(level = tracing::Level::DEBUG))]
pub async fn get_all_balance(
    database: State<'_, tokio::sync::Mutex<Surreal<Db>>>,
) -> Result<Vec<CurrencyBalance>, String> {
    let database = database.lock().await;
    thunes_cli::balances_by_currency(&database)
        .await
        .map_err(|error| error.to_string())
}

#[tauri::command]
#[tracing::instrument(skip(database), ret(level = tracing::Level::DEBUG))]
pub async fn get_currency(
    database: State<'_, tokio::sync::Mutex<Surreal<Db>>>,
    account_name: &str,
) -> Result<String, String> {
    let database = database.lock().await;
    let account: Account = database
        .select(("account", format!(r#""{account_name}""#)))
        .await
        .unwrap()
        .unwrap();

    Ok(account.data.currency)
}

#[tauri::command]
#[tracing::instrument(skip(database), ret(level = tracing::Level::DEBUG))]
pub async fn get_transactions(
    database: State<'_, tokio::sync::Mutex<Surreal<Db>>>,
    account_name: &str,
    options: Option<GetTransactionOptions>,
) -> Result<Vec<TransactionWithId>, String> {
    let database = database.lock().await;

    thunes_cli::get_transactions(&database, account_name, options.unwrap_or_default())
        .await
        .map_err(|error| error.to_string())
}

#[tauri::command]
#[tracing::instrument(skip(database), ret(level = tracing::Level::DEBUG))]
pub async fn add_transaction(
    database: State<'_, tokio::sync::Mutex<Surreal<Db>>>,
    account_name: &str,
    options: AddTransactionOptions,
) -> Result<(), String> {
    let database = database.lock().await;

    thunes_cli::add_transaction(&database, account_name, options)
        .await
        .map_err(|error| error.to_string())
}

#[tauri::command]
#[tracing::instrument(skip(database), ret(level = tracing::Level::DEBUG))]
pub async fn update_transaction(
    database: State<'_, tokio::sync::Mutex<Surreal<Db>>>,
    transaction: TransactionWithId,
) -> Result<(), String> {
    let database = database.lock().await;

    thunes_cli::update_transaction(&database, transaction)
        .await
        .map_err(|error| error.to_string())
}
